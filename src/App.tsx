/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Video, 
  Mic2, 
  Clipboard, 
  Check,
  ChevronRight,
  Download,
  Film,
  User,
  Type as TypeIcon,
  Monitor,
  Youtube,
  ExternalLink,
  Eye,
  EyeOff
} from 'lucide-react';
import { generateScript, type Character, type GenerationResult } from './services/gemini';

export default function App() {
  const [characters, setCharacters] = useState<Character[]>([
    { name: 'Chồng Tèo', appearance: 'Một người đàn ông trẻ tuổi Việt Nam, khuôn mặt hiền lành, tóc đen cắt ngắn gọn gàng, đôi mắt to tròn biểu cảm. Mặc áo thun màu xám đơn giản. Nét vẽ hoạt hình 2D sạch sẽ, phong cách sitcom ấm áp, mắt trắng hình oval với đồng tử đen, đường nét thanh mảnh kiểu Chuyện Nhà Tý.', tone: 'Trầm ấm, vui vẻ nhưng dễ bắt sóng cảm xúc.' },
    { name: 'Vợ Mai', appearance: 'Một người phụ nữ trẻ Việt Nam, tóc đen dài buộc đuôi ngựa cao năng động, đôi mắt to tròn long lanh, khuôn mặt bầu bĩnh đáng yêu. Mặc bộ đồ pijama màu hồng có họa tiết những chú mèo nhỏ dễ thương. Nét vẽ hoạt hình 2D, phong cách sitcom ấm áp kiểu Chuyện Nhà Tý.', tone: 'Nghịch ngợm, hồn nhiên, đôi khi hơi "lầy lội".' }
  ]);
  const [situation, setSituation] = useState('Sự khác biệt giữa đánh rắm lúc mới yêu và sau khi cưới. Bối cảnh 2 vợ chồng nằm chung trên giường từ đầu video đến cuối video không thay đổi. Lúc mới yêu: Chồng khen rắm vợ thơm mùi mít. Sau khi cưới: Chồng mắng vợ là không có liêm sỉ và áp lực tiếng rắm.');
  const [topic, setTopic] = useState('Vợ chồng & Tình cảm');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('9:16');
  const [duration, setDuration] = useState(2);
  const [apiKey, setApiKey] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('gemini_api_key') || 'AIzaSyC56xXkOhnG1Cz8wxkDfRFSpksr__0-_TM';
    }
    return 'AIzaSyC56xXkOhnG1Cz8wxkDfRFSpksr__0-_TM';
  });
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Set global key for window access and save to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).customGeminiKey = apiKey;
      localStorage.setItem('gemini_api_key', apiKey);
    }
  }, [apiKey]);

  const topics = [
    'Chuyện thầm kín',
    'Đời sống vợ chồng',
    'Nuôi dạy con cái',
    'Công việc & Sự nghiệp',
    'Tài chính gia đình',
    'Mâu thuẫn & Hỗn chiến',
    'Đối nội đối ngoại',
    'Hẹn hò & Du lịch',
    'Ba và con',
    'Mẹ và con'
  ];

  const addCharacter = () => {
    setCharacters([...characters, { name: '', appearance: '', tone: '' }]);
  };

  const removeCharacter = (index: number) => {
    setCharacters(characters.filter((_, i) => i !== index));
  };

  const updateCharacter = (index: number, field: keyof Character, value: string) => {
    const newChars = [...characters];
    newChars[index][field] = value;

    // Auto-suggest appearance if name matches keywords
    if (field === 'name') {
      const nameLower = value.toLowerCase();
      
      const check = (words: string[]) => words.some(w => {
        const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`(^|\\s)${escaped}($|\\s)`, 'i').test(nameLower);
      });

      let suggestion = '';
      let toneSuggestion = '';

      if (check(['mẹ', 'vợ', 'bà xã', 'em yêu', 'phụ nữ', 'mama', 'mami'])) {
        suggestion = 'Người phụ nữ trẻ, tóc đen dài buộc đuôi ngựa cao với dây chun màu nâu, đôi mắt to tròn long lanh, khuôn mặt bầu bĩnh dễ thương, phong cách minh họa digital cartoon, mặc bộ đồ pijama họa tiết mèo hồng.';
        toneSuggestion = 'Dịu dàng, nhẹ nhàng nhưng quyết đoán khi cần.';
      } else if (check(['bố', 'ba', 'cha', 'chồng', 'ông xã', 'anh yêu', 'đàn ông', 'papa'])) {
        suggestion = 'Người đàn ông trẻ tuổi, khuôn mặt hiền lành, tóc đen ngắn chải gọn, đôi mắt to màu nâu biểu cảm, phong cách minh họa digital cartoon, nét vẽ sạch, mặc áo thun xám đơn giản.';
        toneSuggestion = 'Trầm ấm, vui vẻ, đôi khi hơi vụng về.';
      } else if (check(['ông', 'cụ ông', 'ông nội', 'ông ngoại'])) {
        suggestion = 'Cụ ông hiền từ, mái tóc bạc trắng, đeo kính gọng tròn, mặc áo sơ mi kẻ sọc cũ, phong cách hoạt hình 2D ấm áp.';
        toneSuggestion = 'Trầm khàn, hiền hậu, chậm rãi.';
      } else if (check(['bà', 'cụ bà', 'bà nội', 'bà ngoại'])) {
        suggestion = 'Cụ bà phúc hậu, tóc búi cao gọn gàng màu bạch kim, mặc áo bà ba truyền thống, đôi mắt nheo lại khi cười, phong cách hoạt hình 2D.';
        toneSuggestion = 'Ấm áp, trìu mến, hơi run nhẹ.';
      } else if (check(['bé tít', 'tít'])) {
        suggestion = 'Cậu bé nhỏ tuổi, đầu trọc (kiểu tóc tu sĩ), khuôn mặt tròn trịa búng ra sữa, mặc bộ pijama họa tiết ngộ nghĩnh, phong cách hoạt hình 2D Chuyện Nhà Tý cực kỳ đáng yêu.';
        toneSuggestion = 'Lém lỉnh, tinh nghịch, hay hỏi những câu "vô tri".';
      } else if (check(['con trai', 'bé trai', 'tèo', 'nhóc', 'cu tí'])) {
        suggestion = 'Cậu bé nhỏ tuổi, khuôn mặt tròn trịa búng ra sữa, đôi mắt to đen láy, mặc bộ pijama họa tiết ngộ nghĩnh, phong cách hoạt hình 2D cực kỳ đáng yêu.';
        toneSuggestion = 'Lém lỉnh, tinh nghịch, nhiều năng lượng.';
      } else if (check(['con gái', 'bé gái', 'bi', 'bún', 'gái', 'bé điệu'])) {
        suggestion = 'Bé gái dễ thương, tóc buộc hai bên with nơ hồng, mắt to tròn lấp lánh, mặc váy đầm xòe, phong cách minh họa digital cartoon sinh động.';
        toneSuggestion = 'Ngọt ngào, nũng nịu, hay cười.';
      }

      if (suggestion && !newChars[index].appearance) {
        newChars[index].appearance = suggestion;
      }
      if (toneSuggestion && !newChars[index].tone) {
        newChars[index].tone = toneSuggestion;
      }
    }

    setCharacters(newChars);
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const data = await generateScript(characters, situation, aspectRatio, duration, topic);
      setResult(data);
    } catch (error) {
      console.error(error);
      alert('Generation failed. Please check the console for details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAllVoices = () => {
    if (!result) return;
    const content = result.scenes.map(s => `[SCENE ${s.sceneNumber}]\n${s.audioScript}`).join('\n\n---\n\n');
    downloadFile(`${result.episodeTitle.replace(/\s+/g, '_')}_All_Voices.txt`, content);
  };

  const downloadAllPrompts = () => {
    if (!result) return;
    const content = result.scenes.map(s => 
      `${s.videoPrompt} --ar ${aspectRatio}. Negative Prompt: ${s.negativePrompt}. Script: ${s.audioScript}`
    ).join('\n\n');
    downloadFile(`${result.episodeTitle.replace(/\s+/g, '_')}_All_Video_Prompts.txt`, content);
  };

  const downloadAllImagePrompts = () => {
    if (!result) return;
    let content = "";
    result.scenes.forEach(s => {
      content += `${s.videoPrompt} --ar ${aspectRatio}\n\n`;
    });
    downloadFile(`${result.episodeTitle.replace(/\s+/g, '_')}_All_Image_Prompts.txt`, content.trim());
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-pastel-blue via-pastel-purple to-pastel-pink text-[#2D3436] font-sans selection:bg-accent-blue/30 overflow-x-hidden pb-20">
      <AnimatePresence mode="wait">
        {isGenerating ? (
          /* Full Screen Loading State */
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-3xl flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="absolute inset-0 bg-radial-gradient from-white/80 via-transparent to-transparent -z-10" />
            <div className="relative mb-8">
              <motion.div
                animate={{ 
                  scale: [1, 1.05, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="w-48 h-48 bg-linear-to-br from-pastel-yellow via-pastel-pink to-pastel-purple rounded-[3.5rem] shadow-2xl flex items-center justify-center relative z-10 border-8 border-white/50"
              >
                <Sparkles className="w-20 h-20 text-yellow-500/80 filter drop-shadow-lg" />
              </motion.div>
              <motion.div 
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-accent-pink/30 rounded-full blur-3xl -z-10" 
              />
            </div>
            
            <div className="space-y-6 max-w-sm">
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black uppercase italic tracking-tighter font-display text-blue-600"
              >
                Đang biên kịch...
              </motion.h2>
              <div className="flex flex-col items-center gap-4">
                <div className="w-64 h-3 bg-pastel-blue rounded-full overflow-hidden border-2 border-white shadow-inner">
                  <motion.div 
                    initial={{ x: "-100%" }}
                    animate={{ x: "0%" }}
                    transition={{ duration: 10, ease: "linear" }}
                    className="w-full h-full bg-accent-blue"
                  />
                </div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">
                  Đang pha chế kịch bản theo đúng chủ đề
                </p>
              </div>
            </div>
          </motion.div>
        ) : result ? (
          /* Results View (Centered) */
          <motion.div 
            key="results"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-4xl mx-auto px-6 pt-12 space-y-12"
          >
            <button 
              onClick={() => setResult(null)}
              className="group flex items-center gap-2 bg-white px-6 py-3 rounded-2xl font-bold text-sm shadow-cartoon hover:shadow-cartoon-hover hover:translate-y-[4px] transition-all border-2 border-[#E1E4E8]"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              Quay lại chỉnh sửa
            </button>

            <div className="bg-white/80 backdrop-blur-sm p-10 rounded-[3rem] shadow-2xl border-4 border-white relative overflow-hidden group">
              <div className="absolute -top-10 -right-10 w-64 h-64 bg-linear-to-br from-pastel-pink to-transparent rounded-full opacity-60 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
              <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-linear-to-tr from-pastel-blue to-transparent rounded-full opacity-60 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
              
              <div className="relative z-10 text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-block px-6 py-2 bg-linear-to-r from-blue-500 to-purple-500 text-white rounded-full text-[10px] font-black uppercase tracking-[0.4em] shadow-lg shadow-blue-500/20"
                >
                  KẾT QUẢ GEN KỊCH BẢN
                </motion.div>
                <h2 className="text-4xl md:text-6xl font-black uppercase italic leading-tight font-display tracking-tighter text-gray-900 bg-linear-to-r from-gray-900 via-gray-700 to-gray-900 bg-clip-text text-transparent drop-shadow-sm">
                  {result.episodeTitle}
                </h2>
              </div>
            </div>

            {/* Character Reference Section */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <User className="w-6 h-6 text-accent-pink" />
                  <h3 className="text-[18px] font-black uppercase tracking-tight font-display text-black">Nhân vật (Prompt tham khảo)</h3>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start gap-3">
                  <div className="bg-red-500 text-white p-1 rounded-lg shrink-0 mt-0.5">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <p className="text-[11px] font-bold text-red-600 leading-relaxed">
                    Vui lòng anh chị copy prompt bên dưới qua Chatgpt, Gemini, Pic4go để tạo ảnh nhân vật đồng bộ.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {result.characterReferences.map((ref, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white rounded-[2.5rem] p-8 shadow-cartoon border-2 border-white space-y-4 group relative"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="bg-black text-white px-4 py-1 rounded-full text-[10px] font-black uppercase">
                          {ref.name}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(ref.referencePrompt, idx + 1000)}
                          className="flex items-center gap-2 px-4 py-2 bg-pastel-purple text-purple-600 rounded-xl hover:scale-105 transition-all text-[10px] font-black uppercase"
                        >
                          {copiedIndex === idx + 1000 ? <Check className="w-3.5 h-3.5" /> : <Clipboard className="w-3.5 h-3.5" />}
                          {copiedIndex === idx + 1000 ? 'Đã chép' : 'Sao chép Prompt'}
                        </button>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-0 bg-pastel-purple/5 blur-xl rounded-[2rem] -z-10" />
                        <p className="text-xs font-mono leading-relaxed text-gray-700 bg-white p-6 rounded-[2rem] border-2 border-dashed border-pastel-purple/50 min-h-[120px]">
                          {ref.referencePrompt}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-cartoon border-2 border-white space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clipboard className="w-6 h-6 text-purple-500" />
                  <h2 className="text-[18px] font-black uppercase tracking-tight text-black">Tổng hợp Prompt hình ảnh</h2>
                </div>
                <button 
                  onClick={downloadAllImagePrompts}
                  className="flex items-center gap-2 px-6 py-2.5 bg-pastel-purple text-purple-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-sm border border-pastel-purple"
                >
                  <Download className="w-4 h-4" />
                  Tải file Prompt (.txt)
                </button>
              </div>
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
                <div className="space-y-4">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Character Reference Prompts</p>
                  {result.characterReferences.map((ref, i) => (
                    <div key={i} className="p-4 bg-pastel-purple/10 rounded-2xl border border-dashed border-pastel-purple/50">
                      <p className="text-[10px] font-black text-purple-600 mb-1">{ref.name}</p>
                      <p className="text-xs font-mono text-gray-600 leading-relaxed">{ref.referencePrompt}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Scene Video Prompts</p>
                  {result.scenes.map((scene, i) => (
                    <div key={i} className="p-4 bg-pastel-blue/10 rounded-2xl border border-dashed border-pastel-blue/50">
                      <p className="text-[10px] font-black text-blue-600 mb-1">Cảnh {scene.sceneNumber}</p>
                      <p className="text-xs font-mono text-gray-600 leading-relaxed">{scene.videoPrompt} --ar {aspectRatio}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-16">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-8">
                <div className="flex items-center gap-3">
                  <Film className="w-6 h-6 text-blue-500" />
                  <h3 className="text-[18px] font-black uppercase tracking-tight font-display text-black">Chi tiết các cảnh phim</h3>
                </div>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={downloadAllVoices}
                    className="flex items-center gap-2 px-6 py-2.5 bg-pastel-pink text-red-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border-2 border-white shadow-cartoon"
                  >
                    <Download className="w-4 h-4" />
                    Tải toàn bộ Voice
                  </button>
                  <button 
                    onClick={downloadAllPrompts}
                    className="flex items-center gap-2 px-6 py-2.5 bg-pastel-blue text-blue-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all border-2 border-white shadow-cartoon"
                  >
                    <Download className="w-4 h-4" />
                    Tải toàn bộ Prompt Video
                  </button>
                </div>
              </div>
              {result.scenes.map((scene, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-cartoon border-2 border-white relative"
                >
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-red-500">
                        <div className="flex items-center gap-2">
                          <Mic2 className="w-5 h-5" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Kịch bản thoại</h4>
                        </div>
                        <button 
                          onClick={() => downloadFile(`Scene_${scene.sceneNumber}_Voice.txt`, scene.audioScript)}
                          className="p-2 bg-pastel-pink/50 rounded-xl text-red-600 hover:scale-110 transition-all"
                          title="Tải về file voice"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="bg-pastel-yellow/50 p-8 rounded-[2rem] text-lg leading-relaxed italic border-2 border-dashed border-pastel-yellow shadow-inner">
                        {scene.audioScript}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-blue-500">
                        <div className="flex items-center gap-2">
                          <Video className="w-5 h-5" />
                          <h4 className="text-[10px] font-black uppercase tracking-widest">Video Prompt</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => downloadFile(`Scene_${scene.sceneNumber}_VideoMaster.txt`, `${scene.videoPrompt} --ar ${aspectRatio}. Negative Prompt: ${scene.negativePrompt}. Script: ${scene.audioScript}`)}
                            className="p-2 bg-pastel-blue rounded-xl text-blue-600 hover:scale-110 transition-all"
                            title="Tải về Master Prompt (Video + Voice)"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => copyToClipboard(scene.videoPrompt, idx)}
                            className="p-2 bg-pastel-blue rounded-xl text-blue-600 hover:scale-110 transition-all"
                            title="Sao chép Video Prompt"
                          >
                            {copiedIndex === idx ? <Check className="w-4 h-4" /> : <Clipboard className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-pastel-blue/30 p-6 rounded-[2rem] border-2 border-pastel-blue">
                          <p className="text-[10px] font-black text-blue-600 uppercase mb-3">Master Prompt</p>
                          <p className="text-sm font-mono leading-relaxed text-blue-900 bg-white/50 p-4 rounded-2xl">
                            {scene.videoPrompt} --ar {aspectRatio}
                          </p>
                        </div>
                        <div className="bg-pastel-pink/30 p-6 rounded-[2rem] border-2 border-pastel-pink shadow-sm">
                          <p className="text-[10px] font-black text-red-500 uppercase mb-3">Negative Prompt</p>
                          <p className="text-sm font-mono text-red-700/80 leading-relaxed italic">
                            {scene.negativePrompt}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
            
            <div className="flex justify-center pt-8">
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="text-xs font-bold uppercase tracking-widest text-blue-400 hover:text-blue-600 transition-colors"
              >
                Cuộn lên đầu trang
              </button>
            </div>
          </motion.div>
        ) : (
          /* Input View (Centered) */
          <motion.div 
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-3xl mx-auto px-6 pt-12 md:pt-20"
          >
            {/* Logo area */}
            <div className="relative text-center mb-16 space-y-6">
              {/* API Key Input Section at top right */}
              <div className="absolute -top-12 right-0 md:-top-16 flex flex-col items-end gap-1 z-50">
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mr-2">Config Gemini API Key</span>
                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm p-1.5 px-2 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="relative flex items-center">
                    <input 
                      type={showKey ? "text" : "password"}
                      placeholder="Nhập API Key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="text-[10px] pl-3 pr-8 py-1.5 bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 w-36 md:w-48 font-mono transition-all"
                    />
                    <button 
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 text-gray-400 hover:text-blue-500 transition-colors p-1"
                      title={showKey ? "Ẩn Key" : "Hiện Key"}
                    >
                      {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[10px] font-bold text-blue-500 hover:text-blue-600 hover:underline px-1 whitespace-nowrap"
                  >
                    Lấy Key
                  </a>
                </div>
              </div>

              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl mb-8 p-1 relative group"
              >
                <div className="absolute inset-0 bg-linear-to-tr from-blue-400 to-purple-400 rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="w-full h-full rounded-[1.8rem] overflow-hidden relative z-10 border-4 border-white">
                  <img 
                    src="https://yt3.googleusercontent.com/Gug5UDLjPMRBto68HqZvJCSryebEkqiI2_9qV_8y16ZKIVLgxYBFx_PyUYZStcTzSc3v7TLq=s900-c-k-c0x00ffffff-no-rj"
                    alt="App Logo"
                    className="w-full h-full object-cover"
                  />
                </div>
              </motion.div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter font-display text-gray-900 leading-tight">
                TOOL VIDEO HOẠT HÌNH <br/>
                <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Sitcom Gia Đình 2D Nội Bộ</span>
              </h1>
              <div className="flex flex-wrap justify-center gap-4">
                <a 
                  href="https://vanthemmo.com/khoa-hoc-youtube-ai-automation-a-z" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-white bg-linear-to-r from-blue-500 to-blue-700 hover:scale-105 transition-all px-8 py-3 rounded-full shadow-lg shadow-blue-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Thông tin khóa học Youtube
                </a>
                <a 
                  href="https://www.youtube.com/@vantheweb?sub_confirmation=1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-red-600 bg-white border-2 border-red-100 hover:border-red-200 px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all"
                >
                  <Youtube className="w-3.5 h-3.5" />
                  Video hướng dẫn sử dụng tool
                </a>
              </div>
            </div>

            <div className="space-y-12">
              {/* Characters */}
              <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-cartoon border-2 border-white space-y-8">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-black uppercase tracking-tight text-black flex items-center gap-3">
                    <User className="w-4 h-4 text-accent-pink" />
                    Tuyến nhân vật
                  </h2>
                  <div className="flex flex-col items-end gap-1">
                    <button 
                      onClick={addCharacter}
                      className="flex items-center gap-2 px-4 py-2 bg-pastel-pink text-accent-pink rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                    >
                      <Plus className="w-3 h-3" />
                      Thêm mới
                    </button>
                    <span className="text-[9px] font-bold text-gray-400 italic pr-2">Ghi "Bé Tít" để nhận dạng nhân vật em bé</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {characters.map((char, idx) => (
                    <motion.div 
                      layout
                      key={idx}
                      className="p-8 bg-linear-to-br from-pastel-pink/40 to-white rounded-[2.5rem] space-y-4 relative group border-2 border-white shadow-sm hover:shadow-md transition-all"
                    >
                      <button 
                        onClick={() => removeCharacter(idx)}
                        className="absolute top-6 right-6 p-2 text-red-300 hover:text-red-500 transition-colors bg-white/50 rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <input 
                        type="text" 
                        placeholder="Tên nhân vật..."
                        value={char.name}
                        onChange={(e) => updateCharacter(idx, 'name', e.target.value)}
                        className="w-full text-lg font-black bg-transparent outline-none pb-3 border-b-2 border-dashed border-pastel-pink focus:border-accent-pink"
                      />
                      <textarea 
                        placeholder="Mô tả ngoại hình..."
                        value={char.appearance}
                        onChange={(e) => updateCharacter(idx, 'appearance', e.target.value)}
                        className="w-full text-xs font-medium bg-transparent outline-none min-h-[100px] resize-none leading-relaxed"
                      />
                      <div className="pt-2">
                        <input 
                          type="text" 
                          placeholder="Giọng điệu (tone)..."
                          value={char.tone}
                          onChange={(e) => updateCharacter(idx, 'tone', e.target.value)}
                          className="w-full text-[10px] font-bold bg-white/50 px-4 py-2 rounded-xl outline-none text-gray-500 border border-pastel-pink/30"
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Topics */}
              <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-cartoon border-2 border-white space-y-6">
                <h2 className="text-[18px] font-black uppercase tracking-tight text-black flex items-center gap-3">
                  <Clipboard className="w-4 h-4 text-purple-400" />
                  Chủ đề (Topic)
                </h2>
                <div className="flex flex-wrap gap-3">
                  {topics.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTopic(t)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                        topic === t
                          ? 'bg-linear-to-r from-purple-500 to-indigo-600 text-white border-purple-200 shadow-lg scale-105'
                          : 'bg-white text-purple-600 border-pastel-purple/30 hover:border-purple-200'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Situation */}
              <div className="bg-white p-8 md:p-10 rounded-[3rem] shadow-cartoon border-2 border-white space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-black uppercase tracking-tight text-black flex items-center gap-3">
                    <Sparkles className="w-4 h-4 text-blue-400" />
                    Kịch bản & Tình huống
                  </h2>
                  <div className="flex flex-col items-end gap-1">
                    <button 
                    onClick={() => {
                      if (characters.length === 0) {
                        setSituation("Hãy thêm nhân vật trước khi yêu cầu gợi ý nhé!");
                        return;
                      }

                      const names = characters.map(c => c.name || "Nhân vật");
                      const n1 = names[0];
                      const n2 = names[1] || "";

                      let prompts: string[] = [];
                      const fixedContext = " Bối cảnh duy nhất: Nhân vật ngồi hoặc đứng cố định tại một vị trí, hậu cảnh giữ nguyên 100% không thay đổi suốt tập phim.";
                      
                      if (topic === 'Chuyện thầm kín') {
                        prompts.push(
                          `Sự khác biệt khi ${n1} và ${n2} nói về những ước mơ dang dở.${fixedContext} Lúc mới yêu: Hào hứng về tương lai. Sau khi cưới: Những suy ngẫm sâu sắc về việc chấp nhận thực tại và tìm thấy hạnh phúc trong những điều nhỏ bé.`,
                          `Một cuộc trò chuyện đêm muộn giữa ${n1} and ${n2} về nỗi sợ tuổi già.${fixedContext} Hai nhân vật cùng nằm cố định trên giường xuyên suốt câu chuyện. Những chia sẻ chân thành về việc cùng nhau già đi là một đặc ân, không phải là gánh nặng.`,
                          `Cuộc thảo luận về giá trị của sự im lặng trong tình yêu.${fixedContext} ${n1} and ${n2} cùng ngồi cố định tại bàn trà tối giản, thỉnh thoảng nhìn nhau với sự thấu hiểu mà không cần lời nói.`
                        );
                      } else if (topic === 'Đời sống vợ chồng') {
                        prompts.push(
                          `Sự khác biệt giữa những cử chỉ quan tâm.${fixedContext} 2 nhân vật cùng ngồi cố định tại bàn ăn gia đình không thay đổi vị trí. Lúc mới yêu: Những món quà xa xỉ. Sau khi cưới: Một chén canh nóng khi đối phương mệt mỏi, nhận ra rằng sự tận tụy thầm lặng mới là tình yêu đích thực.`,
                          `Tình huống ${n1} and ${n2} cùng nhau dọn dẹp nhà cửa.${fixedContext} 2 nhân vật cùng đứng cố định trong phòng khách ngổn ngang kỷ vật. Những mẩu chuyện ôn lại kỷ niệm và triết lý về việc trân trọng quá khứ để xây dựng tương lai.`,
                          `Một buổi chiều bình yên, ${n1} and ${n2} cùng ngồi cố định trên ghế bành và nói về định nghĩa của "nhà".${fixedContext} Không phải là một nơi chốn, mà là cảm giác an tâm khi có người kia bên cạnh.`
                        );
                      } else if (topic === 'Nuôi dạy con cái') {
                        prompts.push(
                          `${n1} và ${n2} cùng nhau nhìn con ngủ.${fixedContext} 2 nhân vật cùng đứng cố định bên nôi con xuyên suốt video. Những suy ngẫm về việc cha mẹ chỉ là những người dẫn đường, không phải là người sở hữu cuộc đời con.`,
                          `Tình huống dạy con về lòng trắc ẩn qua một sự việc nhỏ.${fixedContext} 2 nhân vật cùng ngồi cố định trên sofa phòng khách. ${n1} và ${n2} cùng thảo luận về cách giáo dục nhân cách quan trọng hơn thành tích học tập.`,
                          `${n1} bàng hoàng khi thấy mình đang lặp lại những lời trách móc của cha mẹ.${fixedContext} 2 nhân vật cùng ngồi cố định ở bàn trà. Cùng ${n2} tìm cách hàn gắn, thay đổi để trở thành phiên bản tốt hơn.`
                        );
                      } else if (topic === 'Công việc & Sự nghiệp') {
                        prompts.push(
                          `${n1} đi làm về mệt mỏi và thất vọng về bản thân, ${n2} an ủi bằng triết lý: "Thành công không phải là đích đến, mà là nỗ lực mỗi ngày".${fixedContext} Bối cảnh bàn ăn tối đơn sơ.`,
                          `Cuộc trò chuyện giữa ${n1} và ${n2} về việc cân bằng giữa đam mê và trách nhiệm tài chính.${fixedContext} Bối cảnh phòng làm việc, hai nhân vật ngồi cố định tại bàn. Sự thấu hiểu rằng đôi khi phải tạm gác ước mơ để lo cho tổ ấm là một sự hy sinh cao cả.`,
                          `${n1} định bỏ việc để tìm kiếm giá trị bản thân, ${n2} không ngăn cản mà cùng ngồi phân tích về sự dũng cảm khi dám bắt đầu lại từ đầu.${fixedContext} Hai nhân vật ngồi cố định trên sofa.`
                        );
                      } else if (topic === 'Tài chính gia đình') {
                        prompts.push(
                          `Triết lý về việc "đủ" trong chi tiêu hàng ngày.${fixedContext} Bối cảnh bàn trà. ${n1} và ${n2} bàn về việc hạnh phúc không nằm ở số dư tài khoản mà ở sự đồng lòng khi cùng nhau vượt qua khó khăn tài chính.`,
                          `Sự khác biệt khi đối mặt với việc thắt chặt chi tiêu.${fixedContext} n1 và n2 ngồi cố định tại sofa phòng khách, tìm thấy niềm vui trong việc nấu ăn cùng nhau thay vì đi hàng quán đắt đỏ.`,
                          `Cuộc đối thoại về việc đầu tư cho tương lai và học vấn của con cái thay vì những món đồ trang sức phù phiếm.${fixedContext} Hai nhân vật ngồi cố định tại bàn ăn.`
                        );
                      } else if (topic === 'Mâu thuẫn & Hỗn chiến') {
                        prompts.push(
                          `Cách giải quyết mâu thuẫn một cách trưởng thành.${fixedContext} Bối cảnh sofa phòng khách. ${n1} và ${n2} thay vì tranh cãi ai đúng ai sai, đã chọn cách lắng nghe để hiểu nỗi đau của đối phương.`,
                          `Sự im lặng sau một trận cãi vã, nhưng là sự im lặng để tự nhìn nhận lại bản thân thay vì để trừng phạt người kia.${fixedContext} Bối cảnh phòng bếp, hai nhân vật đứng cố định gần bồn rửa.`,
                          `Cảnh làm hòa chân thành.${fixedContext} Không cần quà cáp, chỉ là một cái ôm và lời xin lỗi từ tâm khảm, nhận ra cái tôi cá nhân nhỏ bé hơn hạnh phúc gia đình. Hai nhân vật ngồi cố định trên sofa.`
                        );
                      } else if (topic === 'Đối nội đối ngoại') {
                        prompts.push(
                          `Triết lý về lòng hiếu thảo.${fixedContext} Bối cảnh phòng khách khi chuẩn bị quà về quê. ${n1} và ${n2} bàn về việc sự hiện diện và lắng nghe cha mẹ quý giá hơn bất kỳ món quà vật chất nào.`,
                          `Tình huống giải quyết khéo léo mâu thuẫn với họ hàng.${fixedContext} Bối cảnh bàn trà. ${n1} và ${n2} cùng thống nhất quan điểm giữ gìn hòa khí nhưng vẫn bảo vệ được ranh giới gia đình nhỏ của mình.`,
                          `Chuẩn bị cho một buổi tiệc gia đình lớn, ${n1} và ${n2} cùng nhau nhắc nhở về sự bao dung đối với những khác biệt về quan điểm giữa các thế hệ.${fixedContext} Hai nhân vật ngồi cố định tại bàn ăn.`
                        );
                      } else if (topic === 'Hẹn hò & Du lịch') {
                        prompts.push(
                          `Triết lý về việc đi du lịch để tìm lại sự kết nối thay vì để check-in.${fixedContext} Bối cảnh chuẩn bị vali trong phòng ngủ, hai nhân vật ngồi cố định trên giường. ${n1} và ${n2} quyết định để điện thoại ở nhà.`,
                          `Một chuyến đi gặp sự cố thời tiết không như mong đợi, nhưng ${n1} và ${n2} vẫn cảm thấy hạnh phúc vì "quan trọng không phải là đi đâu, mà là đi với ai".${fixedContext} Bối cảnh trong phòng khách sạn, hai nhân vật ngồi cố định tại bàn ban công.`,
                          `Cảnh ${n1} và ${n2} cùng nhau ngồi trên ban công, không làm gì cả, chỉ tận hưởng khoảnh khắc hiện tại.${fixedContext} Hai nhân vật ngồi cố định trên ghế bành.`
                        );
                      } else if (topic === 'Ba và con') {
                        prompts.push(
                          `Tình huống ${n1} (ba) dạy ${n2} (con) về sự tự lập.${fixedContext} Bối cảnh sân sau nhà, hai ba con ngồi cố định trên ghế đá. Một bài học về sự mạnh mẽ đầy tiếng cười.`,
                          `${n1} và ${n2} cùng nhau lén mẹ ăn mì tôm đêm khuya.${fixedContext} Bối cảnh bếp tối om, hai ba con ngồi cố định tại bàn. Hai ba con vừa ăn vừa bàn về "bản lĩnh đàn ông" là phải biết sợ... mẹ.`,
                          `${n1} cố gắng giải bài toán lớp 1 của ${n2} nhưng bó tay.${fixedContext} Hai ba con ngồi cố định tại bàn học, cùng chiêm nghiệm: "Con học dốt không phải lỗi tại con hoàn toàn, mà là do... di truyền từ ba".`
                        );
                      } else if (topic === 'Mẹ và con') {
                        prompts.push(
                          `Cảnh ${n1} (mẹ) trang điểm cho ${n2} (con gái).${fixedContext} Bối cảnh bàn trang điểm, hai mẹ con ngồi cố định. Con chê mẹ trang điểm như "tuồng chèo", mẹ dặn: "Đẹp nhân tạo còn hơn xấu tự nhiên, con cứ tin mẹ".`,
                          `${n1} và ${n2} cùng nhau chuẩn bị bữa tối.${fixedContext} Bối cảnh bếp, hai mẹ con đứng cố định tại quầy bếp. Mẹ dạy con "bí quyết" nấu ngon là cho thật nhiều... tình yêu (và bột ngọt).`,
                          `${n1} tâm sự với ${n2} về việc ngày xưa mẹ cũng từng nghịch ngợm giống con.${fixedContext} Bối cảnh sofa phòng khách, hai mẹ con ngồi cố định.`
                        );
                      }

                      // Fallback if no specific topic prompts
                      if (prompts.length === 0) {
                        prompts.push(
                          `${n1} và ${n2} cùng nhau chiêm nghiệm về ý nghĩa của hạnh phúc bình dị.${fixedContext}`,
                          `${n1} chia sẻ một bài học cuộc sống đáng giá mà mình vừa học được cho ${n2}.${fixedContext}`
                        );
                      }

                      if (characters.length === 1) {
                        prompts = [
                          `${n1} đang ngồi một mình dưới ánh trăng, suy ngẫm về những giá trị thực sự của cuộc sống.${fixedContext}`,
                          `${n1} vừa hoàn thành một việc tốt và cảm nhận được niềm vui lan tỏa trong lòng.${fixedContext}`,
                          `${n1} nhâm nhi ly trà nóng, nhận ra rằng sự bình yên trong tâm hồn là tài sản quý giá nhất.${fixedContext}`,
                          `${n1} đang viết nhật ký, ghi lại những điều mình cảm thấy biết ơn trong ngày hôm nay.${fixedContext}`
                        ];
                      }

                      const random = prompts[Math.floor(Math.random() * prompts.length)];
                      setSituation(random);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-pastel-blue text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    Gợi ý ngẫu nhiên
                  </button>
                    <span className="text-[9px] font-bold text-gray-400 italic pr-2 text-right">Có thể tùy chỉnh theo ý thích và kịch bản riêng của bạn</span>
                  </div>
                </div>
                <div className="relative group">
                  <div className="absolute inset-0 bg-linear-to-br from-pastel-blue to-pastel-purple opacity-20 rounded-[2.5rem] blur-xl group-focus-within:opacity-40 transition-opacity" />
                  <textarea 
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder="Mô tả diễn biến tập phim ở đây..."
                    className="w-full text-base font-medium text-gray-800 bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-10 min-h-[200px] outline-none border-4 border-white shadow-inner focus:shadow-xl transition-all relative z-10"
                  />
                </div>
              </div>

              {/* Bottom Config */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[3rem] shadow-cartoon border-2 border-white space-y-6">
                  <h2 className="text-[18px] font-black uppercase tracking-tight text-black">Tỷ lệ khung hình</h2>
                  <div className="flex gap-4">
                    {(['9:16', '16:9'] as const).map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-5 text-sm font-black rounded-2xl border-4 transition-all ${
                          aspectRatio === ratio 
                          ? 'bg-linear-to-r from-blue-500 to-indigo-600 text-white border-blue-200 shadow-lg scale-105' 
                          : 'bg-white text-gray-400 border-pastel-blue/30 hover:border-blue-200'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="bg-white p-8 rounded-[3rem] shadow-cartoon border-2 border-white space-y-6">
                  <h2 className="text-[18px] font-black uppercase tracking-tight text-black">Số cảnh (Scenes)</h2>
                  <div className="relative">
                    <input 
                      type="number" 
                      min="1" 
                      max="100" 
                      value={duration}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (e.target.value === '') { setDuration(0); return; }
                        if (!isNaN(val)) setDuration(Math.min(100, Math.max(0, val)));
                      }}
                      onBlur={() => { if (duration < 1) setDuration(1); }}
                      className="w-full text-2xl font-black bg-pastel-green/30 border-4 border-white rounded-2xl p-4 outline-none focus:bg-pastel-green/50 transition-all text-green-700"
                    />
                  </div>
                </div>
              </div>              {/* Generate Button */}
              <motion.button 
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98, y: 0 }}
                onClick={handleGenerate}
                className="w-full bg-linear-to-r from-blue-600 via-indigo-600 to-purple-600 py-10 rounded-[3rem] shadow-2xl flex items-center justify-center gap-6 text-white hover:brightness-110 transition-all group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-white/40 to-transparent" />
                <Video className="w-8 h-8 text-white/80" />
                <span className="text-xl font-black uppercase tracking-[0.2em]">
                  XUẤT KỊCH BẢN NGAY
                </span>
                <ChevronRight className="w-6 h-6 group-hover:translate-x-3 transition-transform" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
