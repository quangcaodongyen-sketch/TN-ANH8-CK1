
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { QuizService } from './services/geminiService.ts';
import { Question, GameStatus, EncouragementMessage, UserInfo } from './types.ts';
import { ENCOURAGEMENTS, MOTIVATIONS } from './constants.ts';
import { useSoundEffects } from './components/SoundEffects.tsx';
import html2canvas from 'html2canvas';
import { 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Zap,
  GraduationCap,
  Award,
  Download,
  Camera,
  Upload,
  ArrowRight,
  RefreshCw,
  Trash2
} from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', className: '' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<EncouragementMessage | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Đang soạn đề thi...");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const quizService = useMemo(() => new QuizService(), []);
  const { playCorrect, playIncorrect, playFinish } = useSoundEffects();

  const handleStartInfo = (e: React.FormEvent) => {
    e.preventDefault();
    if (userInfo.name && userInfo.className) {
      setStatus(GameStatus.PHOTO_SETUP);
    }
  };

  const startCamera = async () => {
    setUserInfo(prev => ({ ...prev, photo: undefined }));
    setCameraActive(true);
  };

  useEffect(() => {
    let active = true;
    const enableCamera = async () => {
      if (cameraActive && videoRef.current && active) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
            audio: false 
          });
          if (!active) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
        } catch (err) {
          console.error("Camera error:", err);
          alert("Không thể mở camera. Bạn hãy chọn 'Tải ảnh' thay thế nhé!");
          setCameraActive(false);
        }
      }
    };
    if (cameraActive) enableCamera();
    return () => { active = false; stopCamera(); };
  }, [cameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      // Nén ảnh xuống kích thước vừa phải để tránh lỗi payload
      const maxWidth = 800;
      const scale = maxWidth / video.videoWidth;
      canvas.width = maxWidth;
      canvas.height = video.videoHeight * scale;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setUserInfo(prev => ({ ...prev, photo: dataUrl }));
        stopCamera();
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 800;
          const scale = maxWidth / img.width;
          canvas.width = maxWidth;
          canvas.height = img.height * scale;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setUserInfo(prev => ({ ...prev, photo: canvas.toDataURL('image/jpeg', 0.8) }));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const enhanceWithAI = async () => {
    if (!userInfo.photo) return;
    setIsEnhancing(true);
    try {
      const enhanced = await quizService.enhancePhoto(userInfo.photo);
      setUserInfo(prev => ({ ...prev, photo: enhanced }));
    } catch (err) {
      console.error(err);
      alert("AI đang bận một chút, chúng ta dùng ảnh gốc vẫn rất đẹp nhé!");
    } finally {
      setIsEnhancing(false);
    }
  };

  const proceedToQuiz = async () => {
    setStatus(GameStatus.LOADING);
    setLoadingMsg(`Đang soạn đề thi cho ${userInfo.name}...`);
    try {
      const newQuestions = await quizService.generateQuestions();
      setQuestions(newQuestions);
      setCurrentIndex(0);
      setScore(0);
      setIsAnswered(false);
      setSelectedOption(null);
      setFeedback(null);
      setStatus(GameStatus.PLAYING);
    } catch (error) {
      alert("Lỗi tải đề. Vui lòng thử lại!");
      setStatus(GameStatus.START);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered) return;
    setSelectedOption(optionIndex);
    setIsAnswered(true);
    const isCorrect = optionIndex === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      setScore(prev => prev + 1);
      playCorrect();
      setFeedback({ text: ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)], type: 'success' });
      (window as any).confetti({ particleCount: 150, spread: 120, origin: { y: 0.6 } });
    } else {
      playIncorrect();
      setFeedback({ text: MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)], type: 'keepgoing' });
    }
    timerRef.current = setTimeout(() => {
      if (currentIndex + 1 < questions.length) {
        setCurrentIndex(prev => prev + 1);
        setIsAnswered(false);
        setSelectedOption(null);
        setFeedback(null);
      } else {
        playFinish();
        setStatus(GameStatus.FINISHED);
      }
    }, 2800);
  };

  const downloadCertificate = async () => {
    if (!certificateRef.current) return;
    setIsDownloading(true);
    try {
      // Đợi một chút để ảnh render xong hoàn toàn
      await new Promise(r => setTimeout(r, 500));
      const canvas = await html2canvas(certificateRef.current, { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        useCORS: true,
        logging: false,
        allowTaint: true
      });
      const link = document.createElement('a');
      link.download = `Chung_Nhan_${userInfo.name.replace(/\s+/g, '_')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error(err);
      alert('Không thể tải ảnh tự động. Bạn hãy chụp màn hình giấy khen nhé!');
    } finally {
      setIsDownloading(false);
    }
  };

  if (status === GameStatus.START) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-md w-full border-b-[10px] border-indigo-800 bounce-in">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-black text-indigo-950 text-center mb-2 leading-none">GLOBAL SUCCESS 8</h1>
          <p className="text-indigo-500 font-bold text-center mb-8 uppercase tracking-widest text-xs">Phòng luyện thi thông minh</p>
          <form onSubmit={handleStartInfo} className="space-y-5">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Họ và tên học sinh</label>
              <input required type="text" placeholder="NHẬP HỌ TÊN..." className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-slate-800 focus:border-indigo-500 outline-none transition-all" value={userInfo.name} onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Lớp của em</label>
              <input required type="text" placeholder="LỚP (Ví dụ: 8A1)..." className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all" value={userInfo.className} onChange={(e) => setUserInfo({...userInfo, className: e.target.value})} />
            </div>
            <button type="submit" className="w-full bg-indigo-600 text-white font-black text-xl py-5 rounded-2xl shadow-[0_6px_0_rgb(67,56,202)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 mt-4">TIẾP TỤC <ArrowRight /></button>
          </form>
        </div>
      </div>
    );
  }

  if (status === GameStatus.PHOTO_SETUP) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl max-w-lg w-full border-b-[10px] border-indigo-800 bounce-in text-center relative">
          <div className="mb-6">
            <h2 className="text-2xl font-black text-indigo-950 mb-1 uppercase tracking-tight">HÌNH ẢNH HỌC SINH</h2>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider italic">Chuẩn bị một bức ảnh thật tươi tắn nhé!</p>
          </div>
          
          <div className="aspect-[3/4] max-w-[300px] mx-auto bg-black rounded-[2rem] mb-6 relative overflow-hidden border-4 border-indigo-100 shadow-2xl flex items-center justify-center">
            {cameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" />
            ) : userInfo.photo ? (
              <img src={userInfo.photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <div className="text-white flex flex-col items-center p-6 text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                   <Camera className="w-10 h-10 opacity-30" />
                </div>
                <p className="text-xs font-black uppercase tracking-widest opacity-50">Chưa có ảnh đại diện</p>
              </div>
            )}

            {isEnhancing && (
              <div className="absolute inset-0 bg-indigo-600/90 flex flex-col items-center justify-center z-50">
                <RefreshCw className="w-12 h-12 text-white animate-spin mb-4" />
                <p className="text-sm font-black text-white uppercase tracking-widest px-6">AI đang xử lý ảnh thẻ...</p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!cameraActive && !userInfo.photo && (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={startCamera} className="bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-[0_4px_0_rgb(67,56,202)] flex items-center justify-center gap-2 active:translate-y-1">
                  <Camera className="w-5 h-5" /> CHỤP ẢNH
                </button>
                <button onClick={() => fileInputRef.current?.click()} className="bg-slate-100 text-indigo-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2 border-2 border-slate-100">
                  <Upload className="w-5 h-5" /> TẢI ẢNH
                </button>
              </div>
            )}

            {cameraActive && (
               <button onClick={capturePhoto} className="w-full bg-rose-500 text-white font-black py-5 rounded-2xl shadow-[0_6px_0_rgb(225,29,72)] flex items-center justify-center gap-2 active:translate-y-1">
                 <Camera className="w-6 h-6" /> BẤM CHỤP
               </button>
            )}

            {userInfo.photo && !cameraActive && !isEnhancing && (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => setUserInfo({...userInfo, photo: undefined})} className="bg-slate-100 text-slate-600 font-black py-4 rounded-2xl flex items-center justify-center gap-2">
                    <Trash2 className="w-5 h-5" /> XOÁ ẢNH
                  </button>
                  <button onClick={enhanceWithAI} className="bg-pink-500 text-white font-black py-4 rounded-2xl shadow-[0_4px_0_rgb(190,24,93)] flex items-center justify-center gap-2 active:translate-y-1">
                    <Sparkles className="w-5 h-5" /> ĐẸP AI ✨
                  </button>
                </div>
                <button onClick={proceedToQuiz} className="w-full bg-emerald-500 text-white font-black py-5 rounded-2xl shadow-[0_6px_0_rgb(5,150,105)] flex items-center justify-center gap-3 active:translate-y-1 text-xl">
                  VÀO THI NGAY <ArrowRight className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </div>
    );
  }

  if (status === GameStatus.LOADING) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-2xl font-black animate-pulse uppercase">{loadingMsg}</p>
      </div>
    );
  }

  if (status === GameStatus.FINISHED) {
    const rank = score >= 18 ? "XUẤT SẮC" : score >= 15 ? "GIỎI" : score >= 10 ? "KHÁ" : "TRUNG BÌNH";
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 overflow-y-auto">
        <div ref={certificateRef} className="bg-white p-2 rounded-sm shadow-2xl max-w-3xl w-full border-[2px] border-yellow-600 relative overflow-hidden cert-watermark">
          <div className="cert-border h-full p-8 flex flex-col items-center text-center relative">
            <Award className="w-16 h-16 text-yellow-600 mb-2" />
            <h2 className="text-4xl font-black text-indigo-900 uppercase mb-1 tracking-tight">GIẤY CHỨNG NHẬN</h2>
            <p className="text-indigo-500 font-bold mb-8 uppercase tracking-[0.2em] text-[10px]">Thành tích ôn tập Tiếng Anh 8 - Kỳ 1</p>
            
            <div className="flex w-full items-start justify-between mb-8 px-4 text-left">
              <div className="flex-1">
                <p className="text-slate-500 italic mb-1 text-xs">Trân trọng trao tặng cho em:</p>
                <h4 className="text-3xl font-black text-slate-800 uppercase mb-2 border-b-2 border-yellow-500 inline-block min-w-[200px]">{userInfo.name}</h4>
                <p className="text-lg font-bold text-slate-600">Lớp: {userInfo.className}</p>
              </div>
              {userInfo.photo && (
                <div className="w-32 h-40 border-4 border-yellow-500 rounded-lg overflow-hidden shadow-lg rotate-3 ml-6 bg-slate-50">
                  <img src={userInfo.photo} crossOrigin="anonymous" className="w-full h-full object-cover" alt="Student" />
                </div>
              )}
            </div>

            <div className="max-w-md text-slate-700 leading-relaxed mb-10 text-sm">
              Đã hoàn thành ôn tập 20 câu hỏi tiếng Anh chương trình Global Success 8 với kết quả:
              <div className="mt-6 flex justify-center gap-8">
                <div className="bg-indigo-50 px-6 py-2 rounded-xl border border-indigo-100">
                  <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Điểm số</p>
                  <p className="text-3xl font-black text-indigo-600">{score}/20</p>
                </div>
                <div className="bg-pink-50 px-6 py-2 rounded-xl border border-pink-100">
                  <p className="text-[9px] font-black text-pink-400 uppercase mb-1">Xếp loại</p>
                  <p className="text-3xl font-black text-pink-600">{rank}</p>
                </div>
              </div>
            </div>

            <div className="w-full flex justify-between items-end px-10 relative mt-4">
              <div className="text-left text-xs font-bold text-slate-600">Ngày {new Date().toLocaleDateString('vi-VN')}</div>
              <div className="text-center">
                <p className="text-[8px] font-bold uppercase mb-4 text-slate-400">Giáo viên Tiếng Anh</p>
                <p className="text-4xl font-['Great_Vibes'] text-indigo-900 opacity-90 -rotate-3 mb-1" style={{ fontFamily: "'Great Vibes', cursive" }}>Thanh</p>
                <p className="text-sm font-black text-slate-800 uppercase">Đinh Văn Thành</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4 w-full max-w-3xl no-print">
          <button onClick={downloadCertificate} disabled={isDownloading} className="flex-1 bg-white text-indigo-900 font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
            {isDownloading ? <RefreshCw className="animate-spin" /> : <Download />} TẢI GIẤY KHEN
          </button>
          <button onClick={() => window.location.reload()} className="flex-1 bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2"><RotateCcw /> LÀM LẠI</button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  if (!currentQ) return null;
  const progressPercentage = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-indigo-50 flex flex-col items-center p-2 md:p-6 overflow-x-hidden">
      <div className="max-w-2xl w-full mb-4 flex justify-between items-center bg-white p-3 rounded-2xl shadow-md border border-indigo-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black text-xs">{currentIndex + 1}</div>
          <div className="w-24 md:w-40 h-2 bg-slate-100 rounded-full overflow-hidden">
            <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
          </div>
        </div>
        <div className="bg-yellow-400 px-4 py-1.5 rounded-full text-white font-black text-sm flex items-center gap-1.5 shadow-sm">
          <Zap className="w-3 h-3 fill-white" /> {score}
        </div>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border-b-8 border-indigo-200 relative overflow-hidden">
        <div className="relative">
           <div className="flex items-center gap-2 mb-4">
             <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase">Unit {currentQ.unit}</span>
             <span className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">{currentQ.topic}</span>
           </div>
           
           <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-8 leading-tight min-h-[60px]">{currentQ.text}</h2>
           
           <div className="space-y-3 mb-8">
             {currentQ.options.map((option, idx) => {
               let style = "bg-slate-50 border-slate-100 text-slate-700 hover:border-indigo-300";
               if (isAnswered) {
                 if (idx === currentQ.correctAnswer) style = "bg-emerald-500 border-emerald-600 text-white font-black scale-[1.02] shadow-lg";
                 else if (idx === selectedOption) style = "bg-rose-500 border-rose-600 text-white font-black";
                 else style = "bg-slate-50 border-slate-50 opacity-20 text-slate-400";
               }
               return (
                 <button key={idx} disabled={isAnswered} onClick={() => handleAnswer(idx)} className={`w-full text-left p-5 md:p-6 rounded-2xl border-4 transition-all flex items-center justify-between group overflow-hidden ${style}`}>
                   <span className="text-lg md:text-xl relative z-10">{option}</span>
                   {isAnswered && idx === currentQ.correctAnswer && <CheckCircle2 className="w-7 h-7" />}
                   {isAnswered && idx === selectedOption && idx !== currentQ.correctAnswer && <XCircle className="w-7 h-7" />}
                 </button>
               );
             })}
           </div>

           {isAnswered && (
             <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4">
               <div className={`p-5 rounded-2xl text-center font-black text-xl text-white shadow-lg ${feedback?.type === 'success' ? 'bg-emerald-500' : 'bg-orange-400'}`}>
                 {feedback?.text}
               </div>
               <div className="bg-indigo-50 p-5 rounded-2xl border-l-[6px] border-indigo-400 text-indigo-900 text-sm italic">
                 <span className="font-black not-italic text-[10px] uppercase bg-indigo-200 px-2 py-0.5 rounded-md mr-2">Giải thích:</span> {currentQ.explanation}
               </div>
             </div>
           )}
        </div>
      </div>
      <footer className="mt-auto py-6 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em]">Global Success 8 Master • Teacher Đinh Văn Thành</footer>
    </div>
  );
};

export default App;
