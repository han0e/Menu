import React, { useState, useRef, useEffect } from "react";
import { supabase } from "../supabaseClient";
import "../index.css";

export default function PatternModal({
  isOpen,
  onClose,
  onSuccess,
  mode = "verify", // "verify" | "setup" | "change"
  existingPattern = "",
  session = null,
}) {
  const [step, setStep] = useState(mode === "change" && existingPattern ? 0 : mode === "setup" ? 1 : 1);
  const [firstPattern, setFirstPattern] = useState("");
  const [currentPath, setCurrentPath] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Reset state on open
      setStep(mode === "change" && existingPattern ? 0 : 1);
      setFirstPattern("");
      setCurrentPath([]);
      setIsDrawing(false);
      setErrorMessage("");
    }
  }, [isOpen, mode, existingPattern]);

  if (!isOpen) return null;

  // Calculate 9 nodes center positions inside container (3x3 grid)
  const getNodesPositions = () => {
    if (!containerRef.current) return [];
    const rect = containerRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const positions = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        positions.push({
          index: row * 3 + col,
          x: (width / 6) * (col * 2 + 1),
          y: (height / 6) * (row * 2 + 1),
        });
      }
    }
    return positions;
  };

  const getPointerPos = (e) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    let clientX = e.clientX;
    let clientY = e.clientY;

    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if (e.changedTouches && e.changedTouches.length > 0) {
      clientX = e.changedTouches[0].clientX;
      clientY = e.changedTouches[0].clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const checkNodeHit = (pos) => {
    const nodes = getNodesPositions();
    const radiusThreshold = 32; // Hit radius
    for (const node of nodes) {
      const dist = Math.hypot(node.x - pos.x, node.y - pos.y);
      if (dist <= radiusThreshold) {
        return node.index;
      }
    }
    return null;
  };

  const handleStart = (e) => {
    e.preventDefault();
    setErrorMessage("");
    const pos = getPointerPos(e);
    const hitNode = checkNodeHit(pos);
    if (hitNode !== null) {
      setIsDrawing(true);
      setCurrentPath([hitNode]);
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pos = getPointerPos(e);
    const hitNode = checkNodeHit(pos);
    if (hitNode !== null && !currentPath.includes(hitNode)) {
      setCurrentPath((prev) => [...prev, hitNode]);
    }
  };

  const handleEnd = async (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);

    const patternStr = currentPath.join("-");

    if (currentPath.length < 4) {
      setErrorMessage("최소 4개 이상의 점을 연결해야 합니다.");
      setCurrentPath([]);
      return;
    }

    // Process pattern according to mode & step
    if (mode === "verify") {
      if (patternStr === existingPattern) {
        onSuccess && onSuccess(patternStr);
      } else {
        setErrorMessage("패턴이 일치하지 않습니다. 다시 시도해주세요.");
        setCurrentPath([]);
      }
    } else if (mode === "setup") {
      if (step === 1) {
        setFirstPattern(patternStr);
        setStep(2);
        setCurrentPath([]);
        setErrorMessage("");
      } else if (step === 2) {
        if (patternStr === firstPattern) {
          await savePattern(patternStr);
        } else {
          setErrorMessage("패턴이 일치하지 않습니다. 처음부터 다시 설정해주세요.");
          setFirstPattern("");
          setStep(1);
          setCurrentPath([]);
        }
      }
    } else if (mode === "change") {
      if (step === 0) {
        if (patternStr === existingPattern) {
          setStep(1);
          setCurrentPath([]);
          setErrorMessage("");
        } else {
          setErrorMessage("기존 패턴이 일치하지 않습니다.");
          setCurrentPath([]);
        }
      } else if (step === 1) {
        setFirstPattern(patternStr);
        setStep(2);
        setCurrentPath([]);
        setErrorMessage("");
      } else if (step === 2) {
        if (patternStr === firstPattern) {
          await savePattern(patternStr);
        } else {
          setErrorMessage("새 패턴이 일치하지 않습니다. 신규 패턴 입력부터 다시 시도해주세요.");
          setFirstPattern("");
          setStep(1);
          setCurrentPath([]);
        }
      }
    }
  };

  const savePattern = async (patternStr) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { pattern: patternStr },
      });
      if (error) throw error;
      onSuccess && onSuccess(patternStr);
    } catch (err) {
      setErrorMessage("패턴 저장 실패: " + err.message);
      setCurrentPath([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper render positions for SVG lines & dots
  const nodes = getNodesPositions();

  const getTitle = () => {
    if (mode === "verify") return "패턴 확인";
    if (mode === "setup") return "패턴 등록 (최초 설정)";
    if (mode === "change") return "패턴 변경";
    return "패턴 입력";
  };

  const getInstruction = () => {
    if (mode === "verify") return "설정된 패턴을 입력해주세요";
    if (mode === "setup") {
      return step === 1
        ? "새로운 패턴을 그려주세요 (최소 4개 점)"
        : "확인을 위해 패턴을 한 번 더 그려주세요";
    }
    if (mode === "change") {
      if (step === 0) return "현재 사용 중인 기존 패턴을 입력해주세요";
      if (step === 1) return "새로 사용할 신규 패턴을 그려주세요";
      if (step === 2) return "확인을 위해 신규 패턴을 한 번 더 그려주세요";
    }
    return "";
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 11000 }}>
      <div className="modal-content pattern-modal-card">
        <h2 className="pattern-modal-title">{getTitle()}</h2>
        <div className="panel-rule" style={{ marginBottom: "16px" }}>
          <span className="pr-line"></span>
          <span className="pr-gem">◆</span>
          <span className="pr-line"></span>
        </div>

        <p className="pattern-modal-subtitle">{getInstruction()}</p>

        {errorMessage && <p className="pattern-modal-error">{errorMessage}</p>}

        <div
          className="pattern-container"
          ref={containerRef}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          <svg className="pattern-svg">
            {/* Draw active lines */}
            {currentPath.map((nodeIdx, i) => {
              if (i === 0) return null;
              const prevNode = nodes[currentPath[i - 1]];
              const currNode = nodes[nodeIdx];
              if (!prevNode || !currNode) return null;
              return (
                <line
                  key={`line-${i}`}
                  x1={prevNode.x}
                  y1={prevNode.y}
                  x2={currNode.x}
                  y2={currNode.y}
                  className="pattern-line"
                />
              );
            })}
          </svg>

          {/* Draw 9 dots */}
          {nodes.map((node) => {
            const isSelected = currentPath.includes(node.index);
            const isLast = currentPath[currentPath.length - 1] === node.index;
            return (
              <div
                key={node.index}
                className={`pattern-node ${isSelected ? "selected" : ""} ${isLast ? "last" : ""}`}
                style={{
                  left: `${node.x}px`,
                  top: `${node.y}px`,
                }}
              >
                <div className="pattern-node-inner" />
              </div>
            );
          })}
        </div>

        <div className="pattern-modal-actions">
          <button
            type="button"
            className="pattern-btn pattern-btn-cancel"
            onClick={() => {
              setCurrentPath([]);
              onClose && onClose();
            }}
            disabled={loading}
          >
            취소
          </button>
          <button
            type="button"
            className="pattern-btn pattern-btn-reset"
            onClick={() => {
              setCurrentPath([]);
              setErrorMessage("");
            }}
            disabled={loading || currentPath.length === 0}
          >
            다시 그리기
          </button>
        </div>
      </div>
    </div>
  );
}

