import React, { useState, useRef, useEffect } from 'react';
import { INSPIRATION_DATA } from '../data/inspirationData';
import { supabase } from '../supabaseClient';

export default function InspirationGallery({ isOpen, onClose, currentLang }) {
  const [galleryData, setGalleryData] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [columns, setColumns] = useState(3);
  
  const CATEGORIES = [
    { id: '전체보기', displayName: '전체보기' },
    { id: 'cut', displayName: '컷트' },
    { id: 'perm', displayName: '펌' },
    { id: 'color', displayName: '컬러' },
    { id: 'styling', displayName: '스타일링' },
    { id: 'etc', displayName: '기타' }
  ];

  const [allImages, setAllImages] = useState([]);
  const [activeCategory, setActiveCategory] = useState('전체보기');
  
  const initialPinchDist = useRef(null);
  const pinchTimeout = useRef(null);
  
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const touchStartY = useRef(0);
  const touchEndY = useRef(0);

  useEffect(() => {
    if (!isOpen) {
      setSelectedIndex(null);
    }
  }, [isOpen]);

  useEffect(() => {
    async function fetchAllImages() {
      const bucketName = 'lookbook';
      // 1. Get all folders
      const { data: folders, error: folderError } = await supabase.storage.from(bucketName).list('', {
        limit: 100,
      });

      if (folderError || !folders) {
        console.error("Lookbook folder fetch error:", folderError);
        return;
      }

      // Filter out files in root, keep only folders
      const validFolders = folders.filter(f => !f.name.includes('.') && f.name !== '.emptyFolderPlaceholder');

      // 2. Fetch files for each folder in parallel
      const allFiles = [];
      await Promise.all(validFolders.map(async (folder) => {
        const { data: files } = await supabase.storage.from(bucketName).list(folder.name, {
          limit: 100,
        });
        if (files) {
          files.forEach(file => {
            if (!file.name.startsWith('.')) {
              allFiles.push({
                folder: folder.name,
                name: file.name,
                created_at: file.created_at
              });
            }
          });
        }
      }));

      // 3. Sort by created_at desc (newest first)
      allFiles.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // 4. Map to image objects
      const loadedImages = allFiles.map((file, idx) => {
        const filePath = `${file.folder}/${file.name}`;
        const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
        
        // Extract category
        const prefix = file.name.split('_')[0];
        const category = CATEGORIES.some(c => c.id === prefix) ? prefix : 'etc';

        return {
          id: `sb-insp-${idx}`,
          category,
          image: publicUrlData.publicUrl,
          title: file.name.split('.')[0], 
          desc: ''
        };
      });

      setAllImages(loadedImages);
    }
    fetchAllImages();
  }, []);

  // 필터링 적용
  useEffect(() => {
    if (activeCategory === '전체보기') {
      setGalleryData(allImages);
    } else {
      setGalleryData(allImages.filter(img => img.category === activeCategory));
    }
  }, [activeCategory, allImages]);

  if (!isOpen) return null;

  const getLang = (obj) => typeof obj === 'string' ? obj : (obj[currentLang] || obj.ko);

  // --- Grid Pinch Handlers ---
  const getPinchDistance = (touches) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleGridTouchStart = (e) => {
    if (e.touches.length === 2) {
      initialPinchDist.current = getPinchDistance(e.touches);
    }
  };

  const handleGridTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDist.current !== null) {
      const currentDist = getPinchDistance(e.touches);
      const diff = currentDist - initialPinchDist.current;
      
      if (Math.abs(diff) > 40) {
        if (!pinchTimeout.current) {
          if (diff > 0) {
            // Zoom in (spread fingers) -> fewer columns
            setColumns(c => Math.max(1, c - 1));
          } else {
            // Zoom out (pinch fingers) -> more columns
            setColumns(c => Math.min(5, c + 1));
          }
          initialPinchDist.current = currentDist;
          
          pinchTimeout.current = setTimeout(() => {
            pinchTimeout.current = null;
          }, 250);
        }
      }
    }
  };

  const handleGridTouchEnd = (e) => {
    if (e.touches.length < 2) {
      initialPinchDist.current = null;
    }
  };

  const renderCategoryTabs = () => {
    return (
      <div className="filter-tags" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '16px', overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            style={{
              padding: '6px 16px',
              borderRadius: '20px',
              border: activeCategory === cat.id ? '1px solid var(--gold-main)' : '1px solid var(--bdr-lo)',
              background: activeCategory === cat.id ? 'rgba(212, 175, 106, 0.1)' : 'transparent',
              color: activeCategory === cat.id ? 'var(--gold-main)' : 'var(--txt-70)',
              fontSize: '14px',
              fontWeight: activeCategory === cat.id ? '500' : '400',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            {cat.displayName}
          </button>
        ))}
      </div>
    );
  };

  const renderGrid = () => (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {renderCategoryTabs()}
      <div 
        onTouchStart={handleGridTouchStart}
        onTouchMove={handleGridTouchMove}
        onTouchEnd={handleGridTouchEnd}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${columns}, 1fr)`, 
          gap: columns === 1 ? '16px' : '2px',
          padding: columns === 1 ? '16px' : '0px',
          paddingTop: '16px',
          transition: 'padding 0.3s ease, gap 0.3s ease',
          flex: 1,
          alignContent: 'start',
          overflowY: 'auto'
        }}
      >
        {galleryData.length > 0 ? galleryData.map((item, idx) => (
          <div 
            key={item.id}
            style={{ 
              position: 'relative',
              width: '100%',
              paddingBottom: '133.33%',
              cursor: 'pointer', 
              overflow: 'hidden', 
              background: '#222',
              borderRadius: columns === 1 ? '12px' : '0px',
              transition: 'border-radius 0.3s ease'
            }}
            onClick={() => setSelectedIndex(idx)}
          >
            <img src={item.image} alt={getLang(item.title)} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )) : (
          <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', color: 'var(--txt-50)' }}>
            이미지가 없습니다.
          </div>
        )}
      </div>
    </div>
  );

  // --- Detail Swipe Handlers ---
  const handleSwipeStart = (e) => {
    touchStartX.current = e.changedTouches[0].clientX;
    touchStartY.current = e.changedTouches[0].clientY;
  };
  const handleSwipeEnd = (e) => {
    touchEndX.current = e.changedTouches[0].clientX;
    touchEndY.current = e.changedTouches[0].clientY;
    
    const diffX = touchStartX.current - touchEndX.current;
    const diffY = touchStartY.current - touchEndY.current;
    
    // 수직 스와이프(상/하)가 수평 스와이프보다 강하고, 임계값을 넘은 경우 -> 닫기
    if (Math.abs(diffY) > 50 && Math.abs(diffY) > Math.abs(diffX)) {
      setSelectedIndex(null);
    } 
    // 수평 스와이프(좌/우) 처리
    else {
      if (diffX > 50 && selectedIndex < galleryData.length - 1) {
        setSelectedIndex(selectedIndex + 1); // Swipe left (next)
      } else if (diffX < -50 && selectedIndex > 0) {
        setSelectedIndex(selectedIndex - 1); // Swipe right (prev)
      }
    }
  };

  const renderDetail = () => (
    <div 
      onTouchStart={handleSwipeStart}
      onTouchEnd={handleSwipeEnd}
      style={{ position: 'relative', width: '100%', height: '100%', background: '#000', overflow: 'hidden' }}
    >
      <div style={{ 
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20,
        height: '80px', display: 'flex', alignItems: 'flex-start', padding: '16px',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)',
        pointerEvents: 'none' 
      }}>
        <button 
          onClick={() => setSelectedIndex(null)}
          style={{ 
            background: 'none', color: '#fff', border: 'none', cursor: 'pointer', 
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px', pointerEvents: 'auto',
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.5))'
          }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>
      
      <div style={{ 
        display: 'flex', 
        height: '100%',
        width: '100%',
        transition: 'transform 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)', 
        transform: `translateX(-${selectedIndex * 100}%)` 
      }}>
        {galleryData.map((item) => (
          <div key={item.id} style={{ minWidth: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <img src={item.image} alt={getLang(item.title)} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" style={{ zIndex: 9000, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '500px', 
          width: '100%', 
          height: '100%', 
          maxHeight: '85vh', 
          padding: 0, 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 0,
          overflow: 'hidden',
          background: 'var(--bg)',
          borderRadius: '16px'
        }}
      >
        {selectedIndex === null && (
          <div style={{ padding: '16px', borderBottom: '1px solid var(--bdr-lo)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-1)' }}>
            <h2 style={{ color: 'var(--gold-bright)', fontSize: '18px', margin: 0, fontWeight: '500' }}>
              {currentLang === 'ko' ? '스타일 룩북' : (currentLang === 'zh' ? '造型画册' : 'Style Lookbook')}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--txt-70)', cursor: 'pointer', fontSize: '24px', lineHeight: 1 }}>&times;</button>
          </div>
        )}
        
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: selectedIndex !== null ? '#000' : 'var(--bg)' }}>
          {selectedIndex !== null ? renderDetail() : renderGrid()}
        </div>
      </div>
    </div>
  );
}
