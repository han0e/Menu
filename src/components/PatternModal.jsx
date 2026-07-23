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
  const [activePointerPos, setActivePointerPos] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const containerRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const lastPointerPosRef = useRef(null);

  // Sync refs with state for event listeners
  useEffect(() => {
    isDrawingRef.current = isDrawing;
  }, [isDrawing]);

  useEffect(() => {
    currentPathRef.current = currentPath;
  }, [currentPath]);

  useEffect(() => {
    if (isOpen) {
      setStep(mode === "change" && existingPattern ? 0 : 1);
      setFirstPattern("");
      setCurrentPath([]);
      setIsDrawing(false);
      setActivePointerPos(null);
      setErrorMessage("");
    }
  }, [isOpen, mode, existingPattern]);

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

  // Get midpoint node between node1 and node2 if collinear with node in-between
  const getMidNode = (node1Idx, node2Idx) => {
    const r1 = Math.floor(node1Idx / 3);
    const c1 = node1Idx % 3;
    const r2 = Math.floor(node2Idx / 3);
    const c2 = node2Idx % 3;

    const midR = (r1 + r2) / 2;
    const midC = (c1 + c2) / 2;

    if (Number.isInteger(midR) && Number.isInteger(midC)) {
      const midIdx = midR * 3 + midC;
      if (midIdx !== node1Idx && midIdx !== node2Idx) {
        return midIdx;
      }
    }
    return null;
  };

  // Calculate distance from point (px, py) to line segment (x1, y1)-(x2, y2)
  const distToSegment = (px, py, x1, y1, x2, y2) => {
    const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    if (l2 === 0) return { dist: Math.hypot(px - x1, py - y1), t: 0 };
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    const projX = x1 + t * (x2 - x1);
    const projY = y1 + t * (y2 - y1);
    return { dist: Math.hypot(px - projX, py - projY), t };
  };

  const getHitNodesAlongPath = (prevPos, currPos, path) => {
    const nodes = getNodesPositions();
    const radiusThreshold = 38; // Effective hit radius for touch target (38px)
    const hits = [];

    for (const node of nodes) {
      if (path.includes(node.index)) continue;

      // Check distance to current point
      const pointDist = Math.hypot(node.x - currPos.x, node.y - currPos.y);
      if (pointDist <= radiusThreshold) {
        hits.push({ node, t: 1 });
        continue;
      }

      // Check distance to line segment if prevPos is available
      if (prevPos) {
        const { dist, t } = distToSegment(node.x, node.y, prevPos.x, prevPos.y, currPos.x, currPos.y);
        if (dist <= radiusThreshold) {
          hits.push({ node, t });
        }
      }
    }

    hits.sort((a, b) => a.t - b.t);
    return hits.map((h) => h.node.index);
  };

  const addNodesToPath = (newNodes) => {
    setCurrentPath((prevPath) => {
      let updatedPath = [...prevPath];
      for (const nodeIdx of newNodes) {
        if (updatedPath.includes(nodeIdx)) continue;
        const lastNode = updatedPath[updatedPath.length - 1];
        if (lastNode !== undefined) {
          const mid = getMidNode(lastNode, nodeIdx);
          if (mid !== null && !updatedPath.includes(mid)) {
            updatedPath.push(mid);
          }
        }
        updatedPath.push(nodeIdx);
      }
      return updatedPath;
    });
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

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isOpen) return;

    const handleStart = (e) => {
      if (e.cancelable) e.preventDefault();
      setErrorMessage("");
      const pos = getPointerPos(e);
      lastPointerPosRef.current = pos;
      setActivePointerPos(pos);

      const hitNodes = getHitNodesAlongPath(null, pos, []);
      if (hitNodes.length > 0) {
        setIsDrawing(true);
        isDrawingRef.current = true;
        addNodesToPath(hitNodes);
      }
    };

    const handleMove = (e) => {
      if (!isDrawingRef.current) return;
      if (e.cancelable) e.preventDefault();
      const pos = getPointerPos(e);
      setActivePointerPos(pos);

      const prevPos = lastPointerPosRef.current || pos;
      lastPointerPosRef.current = pos;

      const hitNodes = getHitNodesAlongPath(prevPos, pos, currentPathRef.current);
      if (hitNodes.length > 0) {
        addNodesToPath(hitNodes);
      }
    };

    const handleEnd = (e) => {
      if (!isDrawingRef.current) return;
      if (e.cancelable) e.preventDefault();
      setIsDrawing(false);
      isDrawingRef.current = false;
      setActivePointerPos(null);
      lastPointerPosRef.current = null;
      processPatternEnd();
    };

    // Attach non-passive event listeners for touch to prevent console warnings & default gestures
    container.addEventListener("touchstart", handleStart, { passive: false });
    window.addEventListener("touchmove", handleMove, { passive: false });
    window.addEventListener("touchend", handleEnd, { passive: false });

    container.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    return () => {
      container.removeEventListener("touchstart", handleStart);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);

      container.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
    };
  }, [isOpen]);

  const processPatternEnd = async () => {
    const path = currentPathRef.current;
    const patternStr = path.join("-");

    if (path.length < 4) {
      setErrorMessage("최소 4개 이상의 점을 연결해야 합니다.");
      setCurrentPath([]);
      return;
    }

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

  if (!isOpen) return null;

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

        <div className="pattern-container" ref={containerRef}>
          <svg className="pattern-svg">
            {/* Draw active connected lines */}
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

            {/* Trailing line to active finger/pointer position */}
            {isDrawing && currentPath.length > 0 && activePointerPos && (
              <line
                x1={nodes[currentPath[currentPath.length - 1]]?.x}
                y1={nodes[currentPath[currentPath.length - 1]]?.y}
                x2={activePointerPos.x}
                y2={activePointerPos.y}
                className="pattern-line"
                style={{ opacity: 0.8 }}
              />
            )}
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
