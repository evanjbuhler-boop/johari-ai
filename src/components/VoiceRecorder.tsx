import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Square, Pause, Play, RotateCcw, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

interface VoiceRecorderProps {
  onTranscript: (text: string) => void;
  onSubmit: (text: string) => void;
}

const VoiceRecorder = ({ onTranscript, onSubmit }: VoiceRecorderProps) => {
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'paused' | 'recorded' | 'transcribing'>('idle');
  const [transcript, setTranscript] = useState('');
  const [editableTranscript, setEditableTranscript] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await transcribeAudio(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setRecordingState('recording');
      setShowDialog(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.stop();
      setRecordingState('transcribing');
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'recording') {
      mediaRecorderRef.current.pause();
      setRecordingState('paused');
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && recordingState === 'paused') {
      mediaRecorderRef.current.resume();
      setRecordingState('recording');
    }
  };

  const reRecord = () => {
    setRecordingState('idle');
    setTranscript('');
    setEditableTranscript('');
    chunksRef.current = [];
    setShowDialog(false);
  };
  
  const closeDialog = () => {
    setShowDialog(false);
    setRecordingState('idle');
    setTranscript('');
    setEditableTranscript('');
    chunksRef.current = [];
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      const base64Audio = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = reader.result as string;
          // Remove data:audio/webm;base64, prefix
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
      });

      // Send to transcription endpoint
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) throw error;

      if (data?.text) {
        setTranscript(data.text);
        setEditableTranscript(data.text);
        setRecordingState('recorded');
      } else {
        throw new Error('No transcription returned');
      }
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Please try again or type your message.",
        variant: "destructive",
      });
      setRecordingState('idle');
    }
  };

  const handleSubmit = () => {
    if (editableTranscript.trim()) {
      onSubmit(editableTranscript);
      setShowDialog(false);
      setRecordingState('idle');
      setTranscript('');
      setEditableTranscript('');
    }
  };

  return (
    <>
      {/* Centered Microphone with dynamic effects */}
      <div className="flex flex-col items-center justify-center min-h-[280px] gap-6">
        <button
          type="button"
          onClick={startRecording}
          className="relative group"
        >
          {/* Outer pulse rings */}
          <div className="absolute inset-0 -m-8 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 animate-pulse" 
               style={{ animationDuration: '2s' }} />
          <div className="absolute inset-0 -m-12 rounded-full bg-gradient-to-r from-purple-500/10 to-pink-500/10 animate-pulse" 
               style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
          
          {/* Main microphone circle */}
          <div 
            className="relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(340, 75%, 70%), hsl(260, 60%, 65%))',
              boxShadow: '0 8px 32px rgba(255, 138, 180, 0.4), 0 0 0 0 rgba(255, 138, 180, 0.4)',
              animation: 'breathe 4s ease-in-out infinite'
            }}
          >
            <Mic className="h-10 w-10 text-white" strokeWidth={2} />
          </div>
        </button>
        
        <p className="text-muted-foreground text-sm animate-pulse" style={{ animationDuration: '3s' }}>
          Tap to start speaking
        </p>
      </div>

      {/* Recording Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          {/* Recording state */}
          {(recordingState === 'recording' || recordingState === 'paused') && (
            <div className="flex flex-col items-center justify-center gap-6 py-6">
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="font-medium">{recordingState === 'recording' ? 'Recording...' : 'Paused'}</span>
              </div>
              
              {/* Waveform animation */}
              <div className="flex items-center gap-1 h-16">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-gradient-to-t from-purple-500 to-pink-500 rounded-full animate-pulse"
                    style={{
                      height: recordingState === 'recording' ? `${Math.random() * 60 + 20}px` : '20px',
                      animationDelay: `${i * 100}ms`,
                      animationDuration: '800ms'
                    }}
                  />
                ))}
              </div>

              <p className="text-muted-foreground text-sm">
                Speak your message...
              </p>

              {/* Controls */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>
                <Button
                  type="button"
                  onClick={recordingState === 'recording' ? pauseRecording : resumeRecording}
                  variant="outline"
                  size="lg"
                  className="gap-2"
                >
                  {recordingState === 'recording' ? (
                    <>
                      <Pause className="h-4 w-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4" />
                      Resume
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Transcribing state */}
          {recordingState === 'transcribing' && (
            <div className="flex flex-col items-center justify-center gap-6 py-6">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-muted-foreground">Transcribing your message...</p>
            </div>
          )}

          {/* Recorded state - show transcript with edit capability */}
          {recordingState === 'recorded' && (
            <div className="flex flex-col gap-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-green-500">
                  <Check className="h-5 w-5" />
                  <span className="font-medium">Recorded</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={closeDialog}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <Textarea
                value={editableTranscript}
                onChange={(e) => setEditableTranscript(e.target.value)}
                className="min-h-[120px] text-base resize-none border-transparent focus:border-transparent bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground/90 leading-relaxed"
                placeholder="Your transcript will appear here..."
              />

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={reRecord}
                  variant="outline"
                  size="lg"
                  className="flex-1 gap-2"
                >
                  <RotateCcw className="h-4 w-4" />
                  Re-record
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmit}
                  size="lg"
                  className="flex-1 gap-2"
                  style={{
                    background: 'linear-gradient(135deg, hsl(340, 75%, 70%), hsl(260, 60%, 65%))',
                    boxShadow: '0 4px 20px rgba(255, 138, 180, 0.4)'
                  }}
                  disabled={!editableTranscript.trim()}
                >
                  I'm ready
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VoiceRecorder;
