
import React, { useState, useMemo, useRef } from 'react';
import { QuizService } from './services/geminiService.ts';
import { Question, GameStatus, EncouragementMessage, UserInfo } from './types.ts';
import { ENCOURAGEMENTS, MOTIVATIONS } from './constants.ts';
import { useSoundEffects } from './components/SoundEffects.tsx';
import html2canvas from 'html2canvas';
import { 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Zap,
  GraduationCap,
  Award,
  Download,
  ArrowRight,
  RefreshCw,
  User as UserIcon,
  Smile
} from 'lucide-react';

const AVATARS = {
  boy: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4",
  girl: "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=ffdfbf"
};

const App: React.FC = () => {
  const [status, setStatus] = useState<GameStatus>(GameStatus.START);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: '', className: '', gender: 'boy' });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [feedback, setFeedback] = useState<EncouragementMessage | null>(null);
  const [loadingMsg, setLoadingMsg] = useState("Đang soạn đề thi...");
  const [isDownloading, setIsDownloading] = useState(false);
  
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  
  const quizService = useMemo(() => new QuizService(), []);
  const { playCorrect, playIncorrect, playFinish } = useSoundEffects();

  const handleStartQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInfo.name || !userInfo.className) return;

    setStatus(GameStatus.LOADING);
    setLoadingMsg(`Đang chuẩn bị đề thi cho ${userInfo.name}...`);
    
    // Gán avatar dựa trên giới tính
    const avatarUrl = AVATARS[userInfo.gender];
    setUserInfo(prev => ({ ...prev, avatarUrl }));

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
      await new Promise(r => setTimeout(r, 800)); // Đợi SVG nạp đầy đủ
      const canvas = await html2canvas(certificateRef.current, { 
        scale: 2, 
        backgroundColor: '#ffffff', 
        useCORS: true,
        logging: false
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
          <p className="text-indigo-500 font-bold text-center mb-8 uppercase tracking-widest text-xs">Ôn tập cuối kỳ 1 cùng AI</p>
          
          <form onSubmit={handleStartQuiz} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Họ và tên học sinh</label>
              <input required type="text" placeholder="NHẬP HỌ TÊN..." className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-slate-800 focus:border-indigo-500 outline-none transition-all" value={userInfo.name} onChange={(e) => setUserInfo({...userInfo, name: e.target.value})} />
            </div>
            
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Lớp của em</label>
              <input required type="text" placeholder="LỚP (Ví dụ: 8A1)..." className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-800 focus:border-indigo-500 outline-none transition-all" value={userInfo.className} onChange={(e) => setUserInfo({...userInfo, className: e.target.value})} />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Giới tính</label>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  type="button" 
                  onClick={() => setUserInfo({...userInfo, gender: 'boy'})}
                  className={`py-3 rounded-xl border-2 font-black flex items-center justify-center gap-2 transition-all ${userInfo.gender === 'boy' ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-slate-100 text-slate-400'}`}
                >
                  <Smile className="w-4 h-4" /> NAM
                </button>
                <button 
                  type="button" 
                  onClick={() => setUserInfo({...userInfo, gender: 'girl'})}
                  className={`py-3 rounded-xl border-2 font-black flex items-center justify-center gap-2 transition-all ${userInfo.gender === 'girl' ? 'border-pink-600 bg-pink-50 text-pink-600' : 'border-slate-100 text-slate-400'}`}
                >
                  <Smile className="w-4 h-4" /> NỮ
                </button>
              </div>
            </div>

            <button type="submit" className="w-full bg-indigo-600 text-white font-black text-xl py-5 rounded-2xl shadow-[0_6px_0_rgb(67,56,202)] active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 mt-4 hover:bg-indigo-700 transition-colors">
              BẮT ĐẦU THI <ArrowRight />
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (status === GameStatus.LOADING) {
    return (
      <div className="min-h-screen bg-indigo-600 flex flex-col items-center justify-center p-6 text-white text-center">
        <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mb-6" />
        <p className="text-2xl font-black animate-pulse uppercase max-w-sm">{loadingMsg}</p>
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
              <div className="flex-1 pt-4">
                <p className="text-slate-500 italic mb-1 text-xs">Trân trọng trao tặng cho em:</p>
                <h4 className="text-3xl font-black text-slate-800 uppercase mb-2 border-b-2 border-yellow-500 inline-block min-w-[200px]">{userInfo.name}</h4>
                <p className="text-lg font-bold text-slate-600">Lớp: {userInfo.className}</p>
              </div>
              <div className="w-32 h-40 border-4 border-yellow-500 rounded-lg overflow-hidden shadow-lg rotate-3 ml-6 bg-slate-50 flex items-center justify-center">
                <img src={userInfo.avatarUrl} className="w-full h-full object-cover p-2" alt="Student Avatar" />
              </div>
            </div>

            <div className="max-w-md text-slate-700 leading-relaxed mb-10 text-sm">
              Đã hoàn thành tốt 20 câu hỏi tiếng Anh chương trình Global Success 8 với kết quả rực rỡ:
              <div className="mt-6 flex justify-center gap-8">
                <div className="bg-indigo-50 px-6 py-2 rounded-xl border border-indigo-100 shadow-sm">
                  <p className="text-[9px] font-black text-indigo-400 uppercase mb-1">Điểm số</p>
                  <p className="text-3xl font-black text-indigo-600">{score}/20</p>
                </div>
                <div className="bg-pink-50 px-6 py-2 rounded-xl border border-pink-100 shadow-sm">
                  <p className="text-[9px] font-black text-pink-400 uppercase mb-1">Xếp loại</p>
                  <p className="text-3xl font-black text-pink-600">{rank}</p>
                </div>
              </div>
            </div>

            <div className="w-full flex justify-between items-end px-10 relative mt-4">
              <div className="text-left text-xs font-bold text-slate-600">Ngày {new Date().toLocaleDateString('vi-VN')}</div>
              <div className="text-center">
                <p className="text-[8px] font-bold uppercase mb-4 text-slate-400">Giáo viên hướng dẫn</p>
                <p className="text-4xl font-['Great_Vibes'] text-indigo-900 opacity-90 -rotate-3 mb-1" style={{ fontFamily: "'Great Vibes', cursive" }}>Thanh</p>
                <p className="text-sm font-black text-slate-800 uppercase">Đinh Văn Thành</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 flex gap-4 w-full max-w-3xl no-print">
          <button onClick={downloadCertificate} disabled={isDownloading} className="flex-1 bg-white text-indigo-900 font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-slate-50 disabled:opacity-50 transition-colors">
            {isDownloading ? <RefreshCw className="animate-spin" /> : <Download />} TẢI GIẤY KHEN
          </button>
          <button onClick={() => window.location.reload()} className="flex-1 bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-indigo-600"><RotateCcw /> LÀM LẠI</button>
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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg border-2 border-indigo-100">
             <img src={userInfo.avatarUrl} className="w-full h-full p-1" alt="Avatar" />
          </div>
          <div>
            <div className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">Câu hỏi {currentIndex + 1}/20</div>
            <div className="w-24 md:w-40 h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
            </div>
          </div>
        </div>
        <div className="bg-yellow-400 px-4 py-1.5 rounded-full text-white font-black text-sm flex items-center gap-1.5 shadow-sm border-b-2 border-yellow-600">
          <Zap className="w-3 h-3 fill-white" /> ĐIỂM: {score}
        </div>
      </div>

      <div className="max-w-2xl w-full bg-white rounded-[2.5rem] shadow-2xl p-6 md:p-10 border-b-8 border-indigo-200 relative overflow-hidden">
        <div className="relative">
           <div className="flex items-center gap-2 mb-4">
             <span className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-tighter">Unit {currentQ.unit}</span>
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
      <footer className="mt-auto py-6 text-indigo-300 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
         <Smile className="w-3 h-3" /> Global Success 8 Master • Teacher Đinh Văn Thành
      </footer>
    </div>
  );
};

export default App;
