import React from 'react';

interface SourceIntelligencePanelProps {
  uploadedVideoUrl: string | null;
  uploadedVideoMime: string;
  onVideoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onActivateInterrogator: () => void;
}

/**
 * Source intelligence panel for video upload and interrogation
 */
const SourceIntelligencePanel: React.FC<SourceIntelligencePanelProps> = ({
  uploadedVideoUrl,
  uploadedVideoMime,
  onVideoUpload,
  onActivateInterrogator,
}) => {
  return (
    <div>
      <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">
        Source Intelligence
      </h4>
      <div className="space-y-4">
        <label className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-white/10 transition-all group">
          <i
            className="fas fa-cloud-arrow-up mr-3 text-accent group-hover:scale-110 transition-transform"
            aria-hidden="true"
          ></i>
          Ingest Source Clip
          <input
            type="file"
            className="hidden"
            accept="video/*"
            onChange={onVideoUpload}
            aria-label="Upload video file"
          />
        </label>
        {uploadedVideoUrl && (
          <div
            className="p-1 bg-white/5 rounded-2xl border border-white/10 group cursor-pointer"
            onClick={onActivateInterrogator}
            role="button"
            aria-label="Activate visual interrogator"
          >
            <div className="aspect-video bg-black rounded-xl overflow-hidden relative">
              <video
                src={uploadedVideoUrl}
                className="w-full h-full object-cover opacity-60"
                muted
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-white shadow-xl animate-pulse">
                  <i className="fas fa-brain" aria-hidden="true"></i>
                </div>
              </div>
            </div>
            <p className="text-[9px] font-black text-center py-2 text-accent uppercase tracking-widest">
              Activate Interrogator
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SourceIntelligencePanel;
