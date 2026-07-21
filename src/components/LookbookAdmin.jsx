import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import '../index.css';

export default function LookbookAdmin({ session }) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState(new Set());
  const [previewItem, setPreviewItem] = useState(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [gridSize, setGridSize] = useState(150);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadCategory, setUploadCategory] = useState('cut'); // 'cut' | 'perm' | 'color' | 'styling' | 'etc'

  const CATEGORY_LABEL = {
    cut: '컷트',
    perm: '펌',
    color: '컬러',
    styling: '스타일링',
    etc: '기타'
  };

  const designerName = session?.user?.user_metadata?.display_name;
  const safeFolderName = session?.user?.id; // 고유 ID 기반 폴더명 사용

  const pressTimer = useRef(null);
  const wasLongPress = useRef(false);
  const initialPinchDist = useRef(null);
  const lastGridSize = useRef(150);

  useEffect(() => {
    if (safeFolderName) {
      fetchImages();
    }
  }, [safeFolderName]);

  const fetchImages = async () => {
    setLoading(true);
    const { data, error } = await supabase.storage.from('lookbook').list(safeFolderName, {
      limit: 100,
      sortBy: { column: 'created_at', order: 'desc' }
    });

    if (error) {
      console.error('Error fetching lookbook images:', error);
      setLoading(false);
      return;
    }

    // 숨김 파일 제외
    const files = data.filter(f => !f.name.startsWith('.'));
    
    const loadedImages = files.map(file => {
      const filePath = `${safeFolderName}/${file.name}`;
      const { data: publicUrlData } = supabase.storage.from('lookbook').getPublicUrl(filePath);
      return {
        name: file.name,
        path: filePath,
        url: publicUrlData.publicUrl
      };
    });

    setImages(loadedImages);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${uploadCategory}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${safeFolderName}/${fileName}`;

      const { error } = await supabase.storage.from('lookbook').upload(filePath, file);
      if (error) {
        alert('업로드 실패: ' + error.message);
      }
    }
    setUploading(false);
    fetchImages();
  };

  const handleCategoryChange = async (img, newCategory) => {
    const oldName = img.name;
    const parts = oldName.split('_');
    const hasCategory = Object.keys(CATEGORY_LABEL).includes(parts[0]);
    
    let newName;
    if (hasCategory) {
      parts[0] = newCategory;
      newName = parts.join('_');
    } else {
      newName = `${newCategory}_${oldName}`;
    }
    
    const oldPath = img.path;
    const newPath = `${safeFolderName}/${newName}`;

    const { error } = await supabase.storage.from('lookbook').move(oldPath, newPath);
    if (error) {
      alert('카테고리 수정 실패: ' + error.message);
    } else {
      setPreviewItem(null);
      fetchImages();
    }
  };

  const handleMultiDeleteClick = () => {
    if (selectedImages.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const executeMultiDelete = async () => {
    const paths = Array.from(selectedImages);
    const { error } = await supabase.storage.from('lookbook').remove(paths);
    if (error) {
      alert('삭제 실패: ' + error.message);
    } else {
      setSelectedImages(new Set());
      setIsSelectMode(false);
      setShowDeleteConfirm(false);
      fetchImages();
    }
  };

  const toggleSelect = (path) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) newSet.delete(path);
      else newSet.add(path);
      return newSet;
    });
  };

  const startPress = (path) => {
    if (isSelectMode) return;
    wasLongPress.current = false;
    pressTimer.current = setTimeout(() => {
      wasLongPress.current = true;
      setIsSelectMode(true);
      setSelectedImages(new Set([path]));
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleImageClick = (e, img) => {
    e.preventDefault();
    if (wasLongPress.current) {
      wasLongPress.current = false;
      return;
    }
    
    if (isSelectMode) {
      toggleSelect(img.path);
    } else {
      setPreviewItem(img);
    }
  };

  const handleGridTouchStart = (e) => {
    if (e.touches.length === 2 && viewMode === 'grid') {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      initialPinchDist.current = Math.hypot(dx, dy);
      lastGridSize.current = gridSize;
    }
  };

  const handleGridTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDist.current && viewMode === 'grid') {
      e.preventDefault(); // Prevent scrolling while pinching
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const currentDist = Math.hypot(dx, dy);
      
      const ratio = currentDist / initialPinchDist.current;
      let newSize = lastGridSize.current * ratio;
      if (newSize < 80) newSize = 80;
      if (newSize > 350) newSize = 350;
      
      setGridSize(newSize);
    }
  };

  const handleGridTouchEnd = (e) => {
    if (e.touches.length < 2) {
      initialPinchDist.current = null;
    }
  };

  if (!designerName) {
    return <div className="loading-txt">디자이너 정보가 없습니다.</div>;
  }

  return (
    <div className="admin-panel" style={{ width: '100%', maxWidth: '800px', margin: '0 auto', gridColumn: '1 / -1' }}>
      <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--bdr-lo)' }}>
        <h2 style={{ margin: 0 }}>내 룩북 관리 <span style={{ fontSize: '0.6em', color: 'var(--txt-50)', fontWeight: 'normal' }}>(폴더: {designerName})</span></h2>
        
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {!isSelectMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
                style={{ background: 'transparent', border: '1px solid var(--bdr-lo)', color: 'var(--txt-70)', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontSize: '13px' }}
              >
                {viewMode === 'grid' ? '목록 보기 ≡' : '그리드 보기 ⊞'}
              </button>
            </div>
          )}

          {isSelectMode ? (
            <>
              <button 
                onClick={() => { setIsSelectMode(false); setSelectedImages(new Set()); }}
                style={{ background: 'transparent', border: '1px solid var(--txt-70)', color: 'var(--txt-70)', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
              >
                선택 취소
              </button>
              <button 
                onClick={handleMultiDeleteClick}
                disabled={selectedImages.size === 0}
                style={{ 
                  background: 'transparent', 
                  color: selectedImages.size > 0 ? '#ff4d4f' : 'var(--txt-50)', 
                  padding: '6px 16px', borderRadius: '4px', border: selectedImages.size > 0 ? '1px solid #ff4d4f' : '1px solid var(--bdr-lo)', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' 
                }}
              >
                삭제하기 ({selectedImages.size})
              </button>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select 
                value={uploadCategory} 
                onChange={(e) => setUploadCategory(e.target.value)}
                style={{
                  background: 'var(--surface-1)', color: 'var(--txt-100)', border: '1px solid var(--bdr-md)', 
                  padding: '6px 10px', borderRadius: '4px', fontSize: '13px', outline: 'none', cursor: 'pointer'
                }}
                disabled={uploading}
              >
                {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <input 
                type="file" 
                id="lookbook-upload" 
                multiple 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={handleUpload} 
                disabled={uploading}
              />
              <label htmlFor="lookbook-upload" style={{
                background: 'var(--gold-main)', color: '#000', padding: '6px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', margin: 0, display: 'inline-block', opacity: uploading ? 0.7 : 1
              }}>
                {uploading ? '업로드 중...' : '+ 추가하기'}
              </label>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-txt">사진 불러오는 중...</div>
      ) : images.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--txt-50)', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
          아직 업로드된 룩북 사진이 없습니다.
        </div>
      ) : (
        <div 
          onTouchStart={handleGridTouchStart}
          onTouchMove={handleGridTouchMove}
          onTouchEnd={handleGridTouchEnd}
          style={{
          display: viewMode === 'grid' ? 'grid' : 'flex',
          gridTemplateColumns: viewMode === 'grid' ? `repeat(auto-fill, minmax(${gridSize}px, 1fr))` : 'none',
          flexDirection: viewMode === 'list' ? 'column' : 'row',
          gap: '16px'
        }}>
          {images.map(img => (
            <div 
              key={img.name} 
              style={{ 
                display: 'flex',
                flexDirection: viewMode === 'list' ? 'row' : 'column',
                alignItems: viewMode === 'list' ? 'center' : 'stretch',
                gap: viewMode === 'list' ? '16px' : '0',
                padding: viewMode === 'list' ? '8px' : '0',
                background: viewMode === 'list' ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderRadius: '8px', overflow: 'hidden', 
                cursor: 'pointer', 
                border: selectedImages.has(img.path) ? '2px solid var(--gold-main)' : '2px solid transparent',
                transition: 'all 0.2s ease',
                userSelect: 'none', WebkitUserSelect: 'none'
              }}
              onMouseDown={() => startPress(img.path)}
              onMouseUp={cancelPress}
              onMouseLeave={cancelPress}
              onTouchStart={() => startPress(img.path)}
              onTouchEnd={cancelPress}
              onClick={(e) => handleImageClick(e, img)}
            >
              <div style={{
                position: 'relative',
                width: viewMode === 'list' ? '80px' : '100%',
                aspectRatio: '3/4',
                background: '#222',
                borderRadius: viewMode === 'list' ? '4px' : '8px',
                overflow: 'hidden',
                flexShrink: 0
              }}>
                <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: selectedImages.has(img.path) ? 0.7 : 1 }} draggable="false" />
                
                {/* 카테고리 뱃지 */}
                <div style={{
                  position: 'absolute', bottom: '4px', right: '4px', 
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
                  color: 'var(--gold-bright)', fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold'
                }}>
                  {CATEGORY_LABEL[img.name.split('_')[0]] || '기타'}
                </div>
                
                {isSelectMode && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', padding: '8px', alignItems: 'flex-start', justifyContent: 'flex-start',
                    background: selectedImages.has(img.path) ? 'rgba(0,0,0,0.2)' : 'transparent',
                  }}>
                    <input 
                      type="checkbox" 
                      checked={selectedImages.has(img.path)} 
                      readOnly
                      style={{ width: '20px', height: '20px', pointerEvents: 'none' }} 
                    />
                  </div>
                )}
              </div>
              
              {viewMode === 'list' && (
                <div style={{ flex: 1, overflow: 'hidden', paddingRight: '16px' }}>
                  <div style={{ color: 'var(--txt-100)', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '14px' }}>
                    {img.name}
                  </div>
                  <div style={{ color: 'var(--txt-50)', fontSize: '12px', marginTop: '4px' }}>
                    {img.name.split('.').pop().toUpperCase()} Image
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Enlarged Preview & Category Edit Modal */}
      {previewItem && createPortal(
        <div 
          onClick={(e) => {
            if (e.target === e.currentTarget) setPreviewItem(null);
          }}
          style={{ 
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
            background: 'rgba(0,0,0,0.9)', zIndex: 99999, 
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' 
          }}
        >
          <img src={previewItem.url} style={{ maxWidth: '90%', maxHeight: '80%', objectFit: 'contain', marginBottom: '20px' }} alt="Preview" />
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '30px', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' }}>
            <span style={{ color: 'var(--txt-100)', fontSize: '14px', fontWeight: 'bold' }}>카테고리 변경:</span>
            <select 
              value={Object.keys(CATEGORY_LABEL).includes(previewItem.name.split('_')[0]) ? previewItem.name.split('_')[0] : 'etc'} 
              onChange={(e) => handleCategoryChange(previewItem, e.target.value)}
              style={{
                background: 'rgba(0,0,0,0.5)', color: 'var(--gold-bright)', border: '1px solid var(--bdr-hi)', 
                padding: '6px 16px', borderRadius: '20px', fontSize: '14px', outline: 'none', cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              {Object.entries(CATEGORY_LABEL).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={() => setPreviewItem(null)}
            style={{ 
              position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', 
              color: '#fff', fontSize: '40px', cursor: 'pointer', width: '50px', height: '50px' 
            }}
          >
            &times;
          </button>
        </div>,
        document.body
      )}

      {/* Custom Delete Confirm Dialog */}
      {showDeleteConfirm && createPortal(
        <div className="modal-overlay" style={{ zIndex: 99999 }}>
          <div className="modal-content" style={{ textAlign: 'center', padding: '30px', width: '360px' }}>
            <h2 style={{ color: 'var(--gold-bright)', fontSize: '24px', marginBottom: '8px' }}>
              사진 삭제
            </h2>
            <div className="panel-rule" style={{ marginBottom: '20px' }}>
              <span className="pr-line"></span><span className="pr-gem">◆</span><span className="pr-line"></span>
            </div>
            <p style={{ fontSize: '16px', color: 'var(--txt-100)', marginBottom: '30px', lineHeight: '1.5' }}>
              선택한 {selectedImages.size}개의 사진을<br/>정말 삭제하시겠습니까?
            </p>
            <div className="modal-actions">
              <button className="cancel-btn" onClick={() => setShowDeleteConfirm(false)}>취소</button>
              <button className="submit-btn" style={{ background: 'transparent', color: '#ff4d4f', border: '1px solid #ff4d4f' }} onClick={executeMultiDelete}>삭제하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
