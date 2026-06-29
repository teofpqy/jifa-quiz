import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Target, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Participant } from '@/types/quiz';

// Vibrant colors for wheel segments
const WHEEL_COLORS = [
  '#C41E3A', '#D4A843', '#2E7D32', '#1565C0',
  '#6A1B9A', '#C62828', '#00695C', '#E65100',
  '#283593', '#AD1457', '#558B2F', '#0277BD',
];

interface WheelDrawProps {
  participants: Participant[];
  onDraw: (id: number) => void;
  onResetDrawn: () => void;
  onClose: () => void;
}

export default function WheelDraw({ participants, onDraw, onResetDrawn, onClose }: WheelDrawProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winner, setWinner] = useState<Participant | null>(null);
  const rotationRef = useRef(0);
  const animFrameRef = useRef<number>(0);

  const availableParticipants = participants.filter((p) => !p.drawn);
  const allDrawn = participants.length > 0 && availableParticipants.length === 0;

  // Draw the wheel
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 400;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;

    ctx.clearRect(0, 0, size, size);

    const names = availableParticipants.length > 0
      ? availableParticipants.map((p) => p.name)
      : participants.map((p) => p.name);

    if (names.length === 0) {
      // Draw empty wheel
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = '#f0f0f0';
      ctx.fill();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#999';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('暂无人员', centerX, centerY);
      return;
    }

    const segmentAngle = (Math.PI * 2) / names.length;

    // Draw segments
    for (let i = 0; i < names.length; i++) {
      const startAngle = i * segmentAngle + rotationRef.current;
      const endAngle = (i + 1) * segmentAngle + rotationRef.current;

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, startAngle, endAngle);
      ctx.closePath();

      const isDrawn = availableParticipants.length > 0
        ? false
        : participants[i]?.drawn;

      ctx.fillStyle = isDrawn
        ? '#d1d5db' // gray for drawn
        : WHEEL_COLORS[i % WHEEL_COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw text
      const textAngle = startAngle + segmentAngle / 2;
      const textRadius = radius * 0.65;
      const textX = centerX + Math.cos(textAngle) * textRadius;
      const textY = centerY + Math.sin(textAngle) * textRadius;

      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.fillStyle = isDrawn ? '#9ca3af' : '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const name = names[i];
      const maxWidth = radius * 0.5;
      if (ctx.measureText(name).width > maxWidth) {
        let truncated = name;
        while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
          truncated = truncated.slice(0, -1);
        }
        ctx.fillText(truncated + '...', 0, 0);
      } else {
        ctx.fillText(name, 0, 0);
      }
      ctx.restore();
    }

    // Draw center circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = '#C41E3A';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Center text
    ctx.fillStyle = '#C41E3A';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GO', centerX, centerY);
  }, [participants, availableParticipants]);

  const spin = useCallback(() => {
    if (isSpinning || availableParticipants.length === 0) return;

    setIsSpinning(true);
    setWinner(null);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const names = availableParticipants.map((p) => p.name);
    const segmentAngle = (Math.PI * 2) / names.length;

    // Pick winner before spinning
    const winnerIndex = Math.floor(Math.random() * availableParticipants.length);
    const selectedParticipant = availableParticipants[winnerIndex];

    // Calculate target rotation to land on winner at top (12 o'clock = -PI/2)
    const winnerSegmentAngle = winnerIndex * segmentAngle + segmentAngle / 2;
    const topAngle = -Math.PI / 2;
    const minSpins = 5 + Math.random() * 3; // 5-8 full rotations
    const targetRotation = minSpins * Math.PI * 2 + (topAngle - winnerSegmentAngle);

    const startRotation = rotationRef.current;
    const totalRotation = targetRotation - startRotation;
    const duration = 4000 + Math.random() * 1000; // 4-5 seconds
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      rotationRef.current = startRotation + totalRotation * eased;

      // Redraw
      const dpr = window.devicePixelRatio || 1;
      const size = 400;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.scale(dpr, dpr);

      const centerX = size / 2;
      const centerY = size / 2;
      const radius = size / 2 - 10;

      ctx.clearRect(0, 0, size, size);

      for (let i = 0; i < names.length; i++) {
        const startAngle = i * segmentAngle + rotationRef.current;
        const endAngle = (i + 1) * segmentAngle + rotationRef.current;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        const textAngle = startAngle + segmentAngle / 2;
        const textRadius = radius * 0.65;
        const textX = centerX + Math.cos(textAngle) * textRadius;
        const textY = centerY + Math.sin(textAngle) * textRadius;

        ctx.save();
        ctx.translate(textX, textY);
        ctx.rotate(textAngle + Math.PI / 2);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const name = names[i];
        const maxWidth = radius * 0.5;
        if (ctx.measureText(name).width > maxWidth) {
          let truncated = name;
          while (ctx.measureText(truncated + '...').width > maxWidth && truncated.length > 0) {
            truncated = truncated.slice(0, -1);
          }
          ctx.fillText(truncated + '...', 0, 0);
        } else {
          ctx.fillText(name, 0, 0);
        }
        ctx.restore();
      }

      // Center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#C41E3A';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#C41E3A';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GO', centerX, centerY);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        setIsSpinning(false);
        setWinner(selectedParticipant);
        if (selectedParticipant) {
          onDraw(selectedParticipant.id);
        }
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [isSpinning, availableParticipants, onDraw]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      />

      {/* Content */}
      <motion.div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-[#C41E3A]" />
            抽取人员
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 flex flex-col items-center">
          {/* Wheel Canvas */}
          <div className="relative mb-6">
            {/* Pointer (triangle at top) */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
              <div
                className="w-0 h-0"
                style={{
                  borderLeft: '12px solid transparent',
                  borderRight: '12px solid transparent',
                  borderTop: '20px solid #C41E3A',
                  filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.3))',
                }}
              />
            </div>
            <canvas
              ref={canvasRef}
              className={`rounded-full shadow-xl ${isSpinning ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              onClick={spin}
              width={400}
              height={400}
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>

          {/* Status */}
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">
              总人数：<span className="font-bold text-gray-800">{participants.length}</span>
              {' · '}
              待抽取：<span className="font-bold text-[#C41E3A]">{availableParticipants.length}</span>
              {' · '}
              已抽取：<span className="font-bold text-gray-500">{participants.filter((p) => p.drawn).length}</span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={spin}
              disabled={isSpinning || availableParticipants.length === 0}
              className="bg-[#C41E3A] hover:bg-[#A01830] text-white px-8"
              size="lg"
            >
              <Target className="w-5 h-5 mr-2" />
              {isSpinning ? '抽取中...' : '开始抽取'}
            </Button>
            {participants.some((p) => p.drawn) && (
              <Button
                onClick={onResetDrawn}
                variant="outline"
                size="lg"
                disabled={isSpinning}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                重置
              </Button>
            )}
          </div>

          {allDrawn && (
            <motion.p
              className="mt-3 text-amber-600 text-sm font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              所有人员已抽取完毕，点击"重置"可重新开始
            </motion.p>
          )}
        </div>

        {/* Winner Overlay */}
        <AnimatePresence>
          {winner && !isSpinning && (
            <motion.div
              className="absolute inset-0 bg-black/60 flex items-center justify-center p-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-2xl p-8 text-center shadow-2xl"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="w-16 h-16 rounded-full bg-[#C41E3A] flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <p className="text-sm text-gray-500 mb-1">抽中人员</p>
                <h3 className="text-3xl font-bold text-[#C41E3A] mb-4">{winner.name}</h3>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setWinner(null)}
                    variant="outline"
                  >
                    关闭
                  </Button>
                  <Button
                    onClick={() => {
                      setWinner(null);
                      spin();
                    }}
                    className="bg-[#C41E3A] hover:bg-[#A01830] text-white"
                  >
                    再抽一次
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
