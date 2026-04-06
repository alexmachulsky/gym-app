import { useRef, useState } from 'react';
import { useToast } from '../hooks/useToast';

export default function WorkoutShareCard({ workout, exerciseNameById, onClose }) {
  const { addToast } = useToast();
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);

  const generateImage = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const w = 600;
    const h = 400 + workout.sets.length * 28;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, w, h);

    // Accent bar
    ctx.fillStyle = '#a5fa01';
    ctx.fillRect(0, 0, w, 4);

    // Title
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px Inter, sans-serif';
    ctx.fillText('💪 Workout Summary', 24, 48);

    // Date
    ctx.fillStyle = '#888888';
    ctx.font = '14px Inter, sans-serif';
    ctx.fillText(workout.date || 'No date', 24, 72);

    // Duration + effort
    let infoLine = '';
    if (workout.duration_minutes) infoLine += `${workout.duration_minutes} min`;
    if (workout.effort_rating) infoLine += `${infoLine ? '  •  ' : ''}Effort: ${workout.effort_rating}/10`;
    if (infoLine) {
      ctx.fillText(infoLine, 24, 92);
    }

    // Divider
    ctx.strokeStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(24, 110);
    ctx.lineTo(w - 24, 110);
    ctx.stroke();

    // Exercises
    let y = 140;
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#a5fa01';
    ctx.fillText('EXERCISE', 24, y);
    ctx.fillText('SETS', 320, y);
    ctx.fillText('REPS', 390, y);
    ctx.fillText('WEIGHT', 460, y);
    y += 28;

    ctx.font = '14px Inter, sans-serif';
    workout.sets.forEach((s) => {
      ctx.fillStyle = '#ffffff';
      const name = exerciseNameById.get(s.exercise_id) || 'Unknown';
      ctx.fillText(name.length > 30 ? name.slice(0, 28) + '…' : name, 24, y);
      ctx.fillStyle = '#cccccc';
      ctx.fillText(String(s.sets), 320, y);
      ctx.fillText(String(s.reps), 390, y);
      ctx.fillText(String(s.weight), 460, y);
      y += 28;
    });

    // Volume
    const totalVol = workout.sets.reduce(
      (sum, s) => sum + Number(s.weight) * Number(s.reps) * Number(s.sets),
      0
    );
    y += 12;
    ctx.strokeStyle = '#2a2a2a';
    ctx.beginPath();
    ctx.moveTo(24, y);
    ctx.lineTo(w - 24, y);
    ctx.stroke();
    y += 24;
    ctx.fillStyle = '#a5fa01';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText(`Total Volume: ${Math.round(totalVol).toLocaleString()}`, 24, y);

    // Footer
    y += 36;
    ctx.fillStyle = '#555555';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Smart Gym Progress Tracker', 24, y);

    setGenerated(true);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `workout-${workout.date || 'share'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    addToast('Image downloaded', 'success');
  };

  const copyToClipboard = async () => {
    try {
      const canvas = canvasRef.current;
      canvas.toBlob(async (blob) => {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        addToast('Copied to clipboard', 'success');
      });
    } catch {
      addToast('Copy failed — try downloading instead', 'error');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content share-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Share Workout</h3>
        <canvas ref={canvasRef} style={{ width: '100%', maxWidth: '600px', borderRadius: '8px', display: generated ? 'block' : 'none' }} />
        {!generated && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Generate a shareable image of this workout session.
          </p>
        )}
        <div className="button-row" style={{ marginTop: '0.75rem' }}>
          {!generated ? (
            <button type="button" onClick={generateImage}>Generate Image</button>
          ) : (
            <>
              <button type="button" onClick={downloadImage}>📥 Download</button>
              <button type="button" className="ghost-btn" onClick={copyToClipboard}>📋 Copy</button>
            </>
          )}
          <button type="button" className="ghost-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
