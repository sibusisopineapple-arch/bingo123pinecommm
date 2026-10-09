import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Volume2,
  Play,
  Square,
  Upload,
  CheckCircle2,
  Sparkles,
  Smartphone,
  Music,
  X,
  Radio,
  FileAudio,
  Trash2,
  User,
  PlusCircle,
  Clock,
  Search,
  CheckCheck,
  FolderPlus,
  ArrowRight
} from 'lucide-react';
import {
  BellKind,
  BellSoundConfig,
  DEVICE_SOUND_PRESETS,
  UserCustomTone,
  getBellSoundConfigs,
  saveBellSoundConfig,
  getUserCustomTones,
  saveUserCustomTone,
  deleteUserCustomTone,
  saveMultipleUserCustomTones,
  playBellTone,
  playCustomAudioPreview,
  stopAllAlarms,
  subscribeToActiveRinging,
  ActiveRingingStatus,
  setActiveUserSoundContext,
  initCustomToneStore
} from '../utils/audioChime';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  session?: {
    userId: string;
    email: string;
    name: string;
    role: string;
    schoolClass?: string;
  } | null;
}

interface StagedTone {
  tempId: string;
  file: File;
  name: string;
  audioData: string;
  size: number;
}

export const DeviceSoundSelectorModal: React.FC<Props> = ({ isOpen, onClose, session }) => {
  const userUid = session?.userId || 'guest_user';
  const [configs, setConfigs] = useState<Record<BellKind, BellSoundConfig>>(getBellSoundConfigs(userUid));
  const [activeTab, setActiveTab] = useState<BellKind>('meal_bell');
  const [userCustomTones, setUserCustomTones] = useState<UserCustomTone[]>([]);
  const [ringingStatus, setRingingStatus] = useState<ActiveRingingStatus | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addToneSuccess, setAddToneSuccess] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Staged / Pending multi-file upload list
  const [pendingTones, setPendingTones] = useState<StagedTone[]>([]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Set user context
  useEffect(() => {
    setActiveUserSoundContext(userUid);
  }, [userUid]);

  // Subscribe to real-time 15-second ringing state
  useEffect(() => {
    const unsub = subscribeToActiveRinging((status) => {
      setRingingStatus(status);
    });
    return () => unsub();
  }, []);

  // Sync configs and custom tones when modal opens or session changes
  useEffect(() => {
    if (isOpen) {
      setActiveUserSoundContext(userUid);
      setConfigs(getBellSoundConfigs(userUid));
      initCustomToneStore(userUid).then((loaded) => {
        setUserCustomTones(loaded);
      });
      setPendingTones([]);
      setUploadError(null);
      setAddToneSuccess(null);
      setSearchQuery('');
    } else {
      stopAllAlarms();
      setPendingTones([]);
    }
  }, [isOpen, userUid]);

  if (!isOpen) return null;

  const currentConfig = configs[activeTab];

  const handleToneChange = (toneId: string) => {
    const updated = { ...currentConfig, toneId };
    saveBellSoundConfig(activeTab, { toneId }, userUid);
    setConfigs({ ...configs, [activeTab]: updated });
  };

  const handleVolumeChange = (vol: number) => {
    const updated = { ...currentConfig, volume: vol };
    saveBellSoundConfig(activeTab, { volume: vol }, userUid);
    setConfigs({ ...configs, [activeTab]: updated });
  };

  // Process multiple selected audio files
  const processAudioFiles = (files: FileList | File[]) => {
    setUploadError(null);
    setAddToneSuccess(null);
    const audioFiles = Array.from(files).filter(
      (f) => f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(f.name)
    );

    if (audioFiles.length === 0) {
      setUploadError('Please select valid audio files (.mp3, .wav, .m4a, .ogg, .aac).');
      return;
    }

    const readers: Promise<StagedTone>[] = audioFiles.map((file) => {
      return new Promise((resolve, reject) => {
        // Individual file limit 15MB
        if (file.size > 15 * 1024 * 1024) {
          reject(new Error(`"${file.name}" exceeds 15 MB limit.`));
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUri = event.target?.result as string;
          if (dataUri) {
            const baseName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
            const cleanName = baseName.charAt(0).toUpperCase() + baseName.slice(1);
            resolve({
              tempId: `staged_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              file,
              name: cleanName,
              audioData: dataUri,
              size: file.size
            });
          } else {
            reject(new Error(`Failed to read "${file.name}".`));
          }
        };
        reader.onerror = () => reject(new Error(`Error reading "${file.name}".`));
        reader.readAsDataURL(file);
      });
    });

    Promise.allSettled(readers).then((results) => {
      const successful: StagedTone[] = [];
      const errors: string[] = [];

      results.forEach((res) => {
        if (res.status === 'fulfilled') {
          successful.push(res.value);
        } else {
          errors.push(res.reason?.message || 'File read error');
        }
      });

      if (successful.length > 0) {
        setPendingTones((prev) => [...prev, ...successful]);
      }
      if (errors.length > 0) {
        setUploadError(errors.join(', '));
      }
    });
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAudioFiles(e.target.files);
    }
    if (e.target) e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAudioFiles(e.dataTransfer.files);
    }
  };

  // Add all staged tones in one batch
  const handleConfirmAddAllTones = async () => {
    if (pendingTones.length === 0) return;

    const newTones: UserCustomTone[] = pendingTones.map((staged, idx) => ({
      id: `custom_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      userId: userUid,
      userEmail: session?.email,
      name: staged.name.trim() || staged.file.name,
      fileName: staged.file.name,
      audioData: staged.audioData,
      fileSize: staged.size,
      uploadedAt: new Date().toISOString()
    }));

    await saveMultipleUserCustomTones(newTones, userUid);
    const updated = getUserCustomTones(userUid);
    setUserCustomTones(updated);

    // If active tone was preset, auto-select the first newly added tone
    if (newTones.length > 0) {
      handleToneChange(newTones[0].id);
    }

    const count = newTones.length;
    setPendingTones([]);
    setAddToneSuccess(
      count === 1
        ? `Done! "${newTones[0].name}" added to your account's alarm sounds.`
        : `Done! All ${count} custom tones successfully added to your account's alarm library.`
    );
    setTimeout(() => setAddToneSuccess(null), 6000);
  };

  // Add an individual staged tone
  const handleConfirmAddSingleTone = async (staged: StagedTone) => {
    const newTone: UserCustomTone = {
      id: `custom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      userId: userUid,
      userEmail: session?.email,
      name: staged.name.trim() || staged.file.name,
      fileName: staged.file.name,
      audioData: staged.audioData,
      fileSize: staged.size,
      uploadedAt: new Date().toISOString()
    };

    saveUserCustomTone(newTone);
    const updated = getUserCustomTones(userUid);
    setUserCustomTones(updated);
    handleToneChange(newTone.id);

    setPendingTones((prev) => prev.filter((p) => p.tempId !== staged.tempId));
    setAddToneSuccess(`Done! "${newTone.name}" added to your account.`);
    setTimeout(() => setAddToneSuccess(null), 5000);
  };

  // Remove a staged tone from preview
  const handleRemoveStagedTone = (tempId: string) => {
    setPendingTones((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  // Update name of staged tone
  const handleUpdateStagedName = (tempId: string, newName: string) => {
    setPendingTones((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, name: newName } : p))
    );
  };

  // Delete custom tone from user's account
  const handleDeleteCustomTone = (toneId: string, toneName: string) => {
    if (window.confirm(`Remove "${toneName}" from your account's alarm tones library?`)) {
      deleteUserCustomTone(toneId, userUid);
      const updated = getUserCustomTones(userUid);
      setUserCustomTones(updated);

      if (currentConfig.toneId === toneId) {
        handleToneChange('pleasant_dining_chime');
      }
    }
  };

  // Test play current bell tone for 15 seconds
  const handleTestBell = () => {
    if (ringingStatus) {
      stopAllAlarms();
    } else {
      playBellTone(activeTab, 15);
    }
  };

  // Preview custom audio for 15 seconds
  const handlePreviewAudio = (audioData: string, toneName: string) => {
    if (ringingStatus) {
      stopAllAlarms();
    } else {
      playCustomAudioPreview(audioData, toneName, 15);
    }
  };

  const bellDescriptions: Record<BellKind, { label: string; desc: string; icon: string }> = {
    lunch_alarm: {
      label: 'Lunch Alarm',
      desc: 'Official campus lunchtime alarm (12:30 PM – 01:45 PM) across all school spaces.',
      icon: '🍽️'
    },
    meal_bell: {
      label: 'Meal Bell',
      desc: 'Daily dining hall meal alert for Breakfast (7:00 AM), Morning Snack (9:45 AM), Weekday Lunch (1:05 PM), Weekend Lunch (12:55 PM), and Dinner (5:50 PM).',
      icon: '🥣'
    },
    exam_alarm: {
      label: 'Exam Alarm',
      desc: 'Continuous alert sound that rings when an examination or academic test begins.',
      icon: '📝'
    },
    exam_chime: {
      label: 'Exam Chime Bell',
      desc: 'Harmonic resonant chime that marks exam commencement in scheduled classrooms.',
      icon: '🔔'
    },
    notification_alarm: {
      label: 'Notification Alarm',
      desc: 'Arrival chime for announcements, site alerts, Wednesday convocation, and birthday pop-ups.',
      icon: '📣'
    },
    sixty_sec_bell: {
      label: '60s Countdown Bell',
      desc: 'Urgent countdown warning bell activated exactly 60 seconds before an exam or event commences.',
      icon: '⏱️'
    }
  };

  const allAlarmKinds: BellKind[] = [
    'lunch_alarm',
    'meal_bell',
    'exam_alarm',
    'exam_chime',
    'notification_alarm',
    'sixty_sec_bell'
  ];

  const handleApplyToAllAlarms = () => {
    const currentToneId = currentConfig.toneId;
    const currentVol = currentConfig.volume;
    const newConfigs = { ...configs };
    allAlarmKinds.forEach((k) => {
      newConfigs[k] = { ...newConfigs[k], toneId: currentToneId, volume: currentVol };
      saveBellSoundConfig(k, { toneId: currentToneId, volume: currentVol }, userUid);
    });
    setConfigs(newConfigs);
    setAddToneSuccess('Selected sound applied to all alarms and saved successfully!');
    setTimeout(() => setAddToneSuccess(null), 5000);
  };

  // Filtered tones
  const filteredCustomTones = userCustomTones.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200 overflow-y-auto"
    >
      <div className="bg-white rounded-3xl border border-purple-200 shadow-2xl max-w-3xl w-full flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-amber-300 shrink-0 border border-white/10 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  Device Ringtones & Multi-Tone Audio Library
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-black uppercase tracking-wider">
                  15s Ring Duration
                </span>
              </div>
              <p className="text-[11px] text-purple-200/80 font-medium">
                Upload multiple audio files at once & link custom alarm sounds to your account
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              stopAllAlarms();
              onClose();
            }}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white flex items-center justify-center transition"
            title="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ACTIVE RINGING 15-SECOND BANNER */}
        {ringingStatus && (
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white p-3.5 px-5 flex items-center justify-between gap-3 shadow-md animate-pulse shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
                <Radio className="w-4 h-4 animate-spin" />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                  <span>🔔 ACTIVE: {ringingStatus.bellName}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white text-rose-700 text-[10px] font-black font-mono">
                    {ringingStatus.remainingSeconds}s remaining
                  </span>
                </div>
                <div className="text-[11px] text-white/90 font-medium">
                  Tone: {ringingStatus.toneName} (Continuous 15-Second Alarm)
                </div>
              </div>
            </div>

            <button
              onClick={() => stopAllAlarms()}
              className="px-3 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shadow-xs transition flex items-center gap-1 shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Silence</span>
            </button>
          </div>
        )}

        {/* 6 Alarm & Bell Tabs */}
        <div className="p-3 bg-purple-50/70 border-b border-purple-100 flex items-center gap-1.5 shrink-0 overflow-x-auto">
          {allAlarmKinds.map((kind) => {
            const isActive = activeTab === kind;
            return (
              <button
                key={kind}
                onClick={() => {
                  stopAllAlarms();
                  setActiveTab(kind);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-black transition shrink-0 ${
                  isActive
                    ? 'bg-purple-700 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:text-slate-900 border border-purple-100 hover:border-purple-300'
                }`}
              >
                <span>{bellDescriptions[kind].icon}</span>
                <span>{bellDescriptions[kind].label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Bell Overview Card */}
          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                <span>{bellDescriptions[activeTab].icon}</span>
                <span>{bellDescriptions[activeTab].label} Configuration</span>
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyToAllAlarms}
                  className="px-3 py-1 bg-purple-100 hover:bg-purple-200 text-purple-900 border border-purple-300 rounded-xl text-[11px] font-extrabold transition shadow-2xs flex items-center gap-1 active:scale-95"
                  title="Use this selected sound across all alarms"
                >
                  <Sparkles className="w-3 h-3 text-purple-700" />
                  <span>Apply Sound to ALL Alarms</span>
                </button>
                <span className="text-[10px] bg-purple-200 text-purple-900 font-extrabold px-2 py-0.5 rounded-full">
                  Instant Save
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {bellDescriptions[activeTab].desc}
            </p>
          </div>

          {/* 15-SECOND COUNTDOWN PREVIEW CARD */}
          <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 text-white border border-purple-700/60 shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-2xl bg-white/10 flex flex-col items-center justify-center text-amber-300 shrink-0 border border-white/20 shadow-inner font-mono">
                  <span className="text-xl font-black leading-none">
                    {ringingStatus && ringingStatus.kind === activeTab
                      ? String(ringingStatus.remainingSeconds).padStart(2, '0')
                      : '15'}
                  </span>
                  <span className="text-[9px] font-black uppercase text-amber-300/80">sec</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-sm tracking-tight">
                      15-Second Ringing Countdown
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-black uppercase tracking-wider border border-amber-400/30">
                      {bellDescriptions[activeTab].label}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200/90 mt-1 font-medium">
                    {ringingStatus && ringingStatus.kind === activeTab ? (
                      <span className="text-emerald-300 font-bold flex items-center gap-1">
                        <Radio className="w-3.5 h-3.5 animate-spin" />
                        <span>Ringing: <strong>{ringingStatus.remainingSeconds}s countdown remaining</strong></span>
                      </span>
                    ) : (
                      <span>Any chosen or uploaded tone rings continuously for 15 seconds.</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={handleTestBell}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs transition flex items-center justify-center gap-2 shadow-lg shrink-0 active:scale-95 ${
                  ringingStatus && ringingStatus.kind === activeTab
                    ? 'bg-rose-600 hover:bg-rose-700 text-white animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-900/40'
                }`}
              >
                {ringingStatus && ringingStatus.kind === activeTab ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current" />
                    <span>Silence ({ringingStatus.remainingSeconds}s)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Start 15s Ring Countdown</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Progress Bar */}
            <div className="space-y-1 pt-1">
              <div className="flex items-center justify-between text-[10px] font-mono text-purple-200/80">
                <span>15-Second Ring Countdown</span>
                <span>
                  {ringingStatus && ringingStatus.kind === activeTab
                    ? `${ringingStatus.remainingSeconds}s remaining`
                    : '15 seconds'}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden border border-white/10">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                    ringingStatus && ringingStatus.kind === activeTab
                      ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                      : 'bg-emerald-500 w-full'
                  }`}
                  style={{
                    width:
                      ringingStatus && ringingStatus.kind === activeTab
                        ? `${(ringingStatus.remainingSeconds / 15) * 100}%`
                        : '100%'
                  }}
                />
              </div>
            </div>
          </div>

          {/* MULTI-FILE DRAG & DROP / UPLOAD ZONE */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`p-5 rounded-3xl border-2 border-dashed transition flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isDragging
                ? 'border-purple-600 bg-purple-100/80 ring-4 ring-purple-600/20'
                : 'border-purple-200 bg-purple-50/50 hover:border-purple-400'
            }`}
          >
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <FolderPlus className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5 justify-center sm:justify-start">
                  <span>Upload Multiple Sound Files</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-200 text-purple-900 text-[10px] font-black uppercase">
                    Batch upload enabled
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Select or drag & drop 1, 5, 10 or more audio files (.mp3, .wav, .m4a, .ogg)
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0 active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Select Audio Files</span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,.mp3,.wav,.ogg,.m4a,.aac"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>

          {uploadError && (
            <p className="text-[11px] text-rose-600 font-bold bg-rose-50 p-3 rounded-2xl border border-rose-200">
              {uploadError}
            </p>
          )}

          {/* STAGED MULTI-FILE REVIEW (BEFORE STATING DONE & ADDING TO ACCOUNT) */}
          {pendingTones.length > 0 && (
            <div className="p-4 sm:p-5 rounded-3xl bg-amber-50/90 border-2 border-amber-300 shadow-md space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-amber-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <FileAudio className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-amber-950 tracking-wide flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Review Staged Tones ({pendingTones.length} Selected)</span>
                    </div>
                    <div className="text-[11px] text-amber-800 font-medium">
                      Customize titles before adding to your account alarm library
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPendingTones([])}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-slate-700 border border-amber-300 font-bold text-xs rounded-xl transition"
                  >
                    Discard All
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmAddAllTones}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span>Add All ({pendingTones.length}) Tones</span>
                  </button>
                </div>
              </div>

              {/* 15-Second Ring Time Notification */}
              <div className="p-3 bg-white/90 rounded-xl border border-amber-200 text-[11px] text-amber-900 font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>15-Second Duration:</strong> When activated, each tone will automatically loop and ring for a full <strong>15 seconds</strong> count down.
                </span>
              </div>

              {/* List of Staged Files with Individual Inputs and Preview */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {pendingTones.map((staged) => (
                  <div
                    key={staged.tempId}
                    className="p-3 rounded-2xl bg-white border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span className="truncate max-w-[200px] font-mono">{staged.file.name}</span>
                        <span>{(staged.size / 1024).toFixed(0)} KB</span>
                      </div>
                      <input
                        type="text"
                        value={staged.name}
                        onChange={(e) => handleUpdateStagedName(staged.tempId, e.target.value)}
                        placeholder="Custom Tone Name..."
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-amber-600"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handlePreviewAudio(staged.audioData, staged.name)}
                        className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                        title="Preview sound for 15 seconds"
                      >
                        <Play className="w-3 h-3 fill-current text-amber-700" />
                        <span>Preview (15s)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleConfirmAddSingleTone(staged)}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                        title="Add this single tone"
                      >
                        <PlusCircle className="w-3 h-3" />
                        <span>Add</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleRemoveStagedTone(staged.tempId)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-lg"
                        title="Remove from queue"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-[10px] text-amber-800 text-center font-bold pt-1">
                🔒 Uploaded tones are stored exclusively for account: {session?.name || 'My Account'} ({session?.email || 'Logged in'})
              </div>
            </div>
          )}

          {/* SUCCESS MESSAGE AFTER ADDING */}
          {addToneSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between gap-2 shadow-xs animate-in fade-in">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{addToneSuccess}</span>
              </div>
              <button
                onClick={() => setAddToneSuccess(null)}
                className="text-emerald-700 hover:text-emerald-900 text-xs font-black"
              >
                ✕
              </button>
            </div>
          )}

          {/* SECTION 1: MY ACCOUNT CUSTOM UPLOADED TONES LIBRARY */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-purple-600" />
                  <span>My Account Custom Tones Library ({userCustomTones.length})</span>
                </label>
                <p className="text-[11px] text-slate-500 font-medium">
                  Personal uploaded tones library for {session?.name || 'your account'} (Unlimited capacity)
                </p>
              </div>

              {/* Search filter if there are 3+ tones */}
              {userCustomTones.length >= 3 && (
                <div className="relative w-full sm:w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search custom tones..."
                    className="w-full pl-8 pr-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-purple-600"
                  />
                </div>
              )}
            </div>

            {/* List of User's Uploaded Custom Tones */}
            {userCustomTones.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredCustomTones.map((tone) => {
                  const isSelected = currentConfig.toneId === tone.id;
                  return (
                    <div
                      key={tone.id}
                      className={`p-3.5 rounded-2xl border transition relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-purple-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleToneChange(tone.id)}
                            className="text-left flex-1"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="font-black text-xs text-slate-900">{tone.name}</span>
                              {isSelected && (
                                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-black uppercase">
                                  Active
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-medium truncate mt-0.5">
                              {tone.fileName} • {(tone.fileSize / 1024).toFixed(0)} KB
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCustomTone(tone.id, tone.name)}
                            className="text-slate-400 hover:text-rose-600 p-1 rounded-lg transition"
                            title="Delete this tone from your library"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => handlePreviewAudio(tone.audioData, tone.name)}
                          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-lg transition flex items-center gap-1"
                          title="Preview tone for 15 seconds"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          <span>Test 15s Ring</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToneChange(tone.id)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-extrabold transition ${
                            isSelected
                              ? 'bg-purple-700 text-white'
                              : 'bg-slate-100 text-slate-700 hover:bg-purple-600 hover:text-white'
                          }`}
                        >
                          {isSelected ? '✓ In Use' : 'Select Tone'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
                <FileAudio className="w-7 h-7 text-slate-400 mx-auto mb-1.5" />
                <p className="text-xs text-slate-600 font-bold">
                  No custom sound files in your account library yet.
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  Use the upload area above to add as many audio files as you want.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 2: SCHOOL PRESET SOUNDS & RINGTONES */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5 text-purple-600" />
                <span>School Preset Sounds & Ringtones</span>
              </label>
              <span className="text-[11px] text-slate-400 font-medium">
                Choose suitable preset (15s loop)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEVICE_SOUND_PRESETS.map((preset) => {
                const isSelected = currentConfig.toneId === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleToneChange(preset.id)}
                    className={`p-3 rounded-2xl border text-left transition relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-purple-50/90 border-purple-600 ring-2 ring-purple-600/20 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-purple-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-extrabold text-xs text-slate-900">{preset.name}</span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span className="capitalize">{preset.category} sound</span>
                      <span className="font-mono text-purple-700 font-bold">15s loop</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Volume Control */}
          <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-purple-600" />
                <span>Ringtone & Alarm Volume</span>
              </span>
              <span className="font-mono text-purple-700 font-bold">
                {Math.round(currentConfig.volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={currentConfig.volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-full accent-purple-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Tone settings saved for {session?.name || 'your account'}</span>
          </div>

          <button
            onClick={() => {
              stopAllAlarms();
              onClose();
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
