
import React, { useState, useCallback } from 'react';
import { AppState } from './types';
import type { Scores, KeyAnswers, GradedStudent } from './types';
import { analyzeKeySheet, gradeStudentSheet } from './services/geminiService';
import { base64ToFile } from './utils/fileUtils';
import { UploadIcon, CheckCircleIcon, ArrowRightIcon, BackspaceIcon, CameraIcon, ArrowLeftIcon } from './components/IconComponents';
import CameraScanner from './components/CameraScanner';
import ResultsTable from './components/ResultsTable';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.UPLOAD_KEY);
  const [keyImageFile, setKeyImageFile] = useState<File | null>(null);
  const [keyAnswers, setKeyAnswers] = useState<KeyAnswers | null>(null);
  const [scores, setScores] = useState<Scores>({ multipleChoice: 1, complexMultipleChoice: 2, essay: 5 });
  const [gradedStudents, setGradedStudents] = useState<GradedStudent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showKeyScanner, setShowKeyScanner] = useState<boolean>(false);


  const handleKeyFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setKeyImageFile(e.target.files[0]);
    }
  };

  const handleAnalyzeKey = async () => {
    if (!keyImageFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const answers = await analyzeKeySheet(keyImageFile);
      setKeyAnswers(answers);
      setAppState(AppState.SET_SCORES);
    } catch (err) {
      console.error(err);
      setError("Gagal menganalisis kunci jawaban. Pastikan gambar jelas dan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleScoreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setScores(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleStartScanning = () => {
    setAppState(AppState.SCANNING);
  };

  const handleStudentSheetCapture = useCallback(async (base64Image: string, mimeType: string) => {
    if (!keyAnswers) {
      setError("Kunci jawaban tidak tersedia. Mohon ulangi dari awal.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const gradedScores = await gradeStudentSheet(base64Image, mimeType, keyAnswers, scores);
      setGradedStudents(prev => [
        ...prev,
        {
          id: prev.length + 1,
          scores: gradedScores
        }
      ]);
    } catch (err) {
      console.error(err);
      setError("Gagal menilai lembar jawaban siswa. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }, [keyAnswers, scores]);
  
  const handleKeyCapture = useCallback((base64Image: string, mimeType: string) => {
    const fileName = `kunci-jawaban-${Date.now()}.jpg`;
    const file = base64ToFile(base64Image, fileName, mimeType);
    setKeyImageFile(file);
    setShowKeyScanner(false); // Go back to the upload view to show the captured image
  }, []);

  const resetApp = () => {
    setAppState(AppState.UPLOAD_KEY);
    setKeyImageFile(null);
    setKeyAnswers(null);
    setGradedStudents([]);
    setError(null);
    setIsLoading(false);
    setShowKeyScanner(false);
  };

  const renderContent = () => {
    switch (appState) {
      case AppState.UPLOAD_KEY:
        if (showKeyScanner) {
            return (
                <div className="w-full max-w-2xl text-center">
                    <h2 className="text-2xl font-bold mb-2">Pindai Kunci Jawaban</h2>
                    <p className="text-slate-600 mb-2">Posisikan kamera agar seluruh kunci jawaban terlihat jelas.</p>
                    <CameraScanner onCapture={handleKeyCapture} isScanning={isLoading} captureButtonText="Ambil Foto Kunci" />
                    <button 
                        onClick={() => setShowKeyScanner(false)} 
                        className="w-full mt-4 bg-slate-500 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-slate-600 transition-all duration-300 flex items-center justify-center">
                        <ArrowLeftIcon className="w-5 h-5 mr-2" />
                        Kembali ke Unggah File
                    </button>
                </div>
            );
        }
        return (
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-2">Langkah 1: Sediakan Kunci Jawaban</h2>
            <p className="text-slate-600 mb-6">Unggah file atau gunakan kamera untuk memindai lembar jawaban yang akan dijadikan acuan.</p>
            <label htmlFor="key-upload" className="w-full h-48 border-2 border-dashed border-slate-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-slate-100 transition-colors">
              {keyImageFile ? (
                <div className="text-green-600 flex flex-col items-center">
                  <CheckCircleIcon className="w-16 h-16" />
                  <span className="mt-2 font-semibold">{keyImageFile.name}</span>
                </div>
              ) : (
                <div className="text-slate-500">
                  <UploadIcon className="w-16 h-16 mx-auto" />
                  <span className="mt-2">Klik untuk memilih file</span>
                </div>
              )}
            </label>
            <input id="key-upload" type="file" accept="image/*" className="hidden" onChange={handleKeyFileChange} />
            
            <div className="my-4 flex items-center">
                <div className="flex-grow border-t border-slate-300"></div>
                <span className="flex-shrink mx-4 text-slate-500 font-semibold">ATAU</span>
                <div className="flex-grow border-t border-slate-300"></div>
            </div>

            <button onClick={() => setShowKeyScanner(true)} className="w-full bg-slate-700 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-slate-800 transition-all duration-300 flex items-center justify-center mb-6">
                <CameraIcon className="w-5 h-5 mr-2" />
                Gunakan Kamera untuk Memindai
            </button>
            
            <button onClick={handleAnalyzeKey} disabled={!keyImageFile || isLoading} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 transition-all duration-300 flex items-center justify-center">
              {isLoading ? 'Menganalisis...' : 'Analisis Kunci Jawaban'}
              {!isLoading && <ArrowRightIcon className="w-5 h-5 ml-2" />}
            </button>
          </div>
        );

      case AppState.SET_SCORES:
        return (
          <div className="w-full max-w-md text-center">
            <h2 className="text-2xl font-bold mb-2">Langkah 2: Atur Bobot Nilai</h2>
            <p className="text-slate-600 mb-6">Tentukan nilai untuk setiap jenis soal yang benar.</p>
            <div className="space-y-4 text-left">
              <div>
                <label htmlFor="multipleChoice" className="block text-sm font-medium text-slate-700">Nilai Pilihan Ganda (per soal)</label>
                <input type="number" name="multipleChoice" id="multipleChoice" value={scores.multipleChoice} onChange={handleScoreChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="complexMultipleChoice" className="block text-sm font-medium text-slate-700">Nilai PG Kompleks (per soal)</label>
                <input type="number" name="complexMultipleChoice" id="complexMultipleChoice" value={scores.complexMultipleChoice} onChange={handleScoreChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>
              <div>
                <label htmlFor="essay" className="block text-sm font-medium text-slate-700">Nilai Esai (nilai maks per soal)</label>
                <input type="number" name="essay" id="essay" value={scores.essay} onChange={handleScoreChange} className="mt-1 block w-full px-3 py-2 bg-white border border-slate-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"/>
              </div>
            </div>
            <button onClick={handleStartScanning} className="w-full mt-8 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-blue-700 transition-all duration-300 flex items-center justify-center">
              Mulai Pindai Jawaban Siswa
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </button>
          </div>
        );

      case AppState.SCANNING:
        return (
          <div className="w-full text-center">
            <h2 className="text-2xl font-bold mb-2">Langkah 3: Pindai & Nilai</h2>
            <p className="text-slate-600 mb-2">Arahkan kamera ke lembar jawaban siswa dan tekan tombol pindai.</p>
            <CameraScanner onCapture={handleStudentSheetCapture} isScanning={isLoading} />
            <ResultsTable results={gradedStudents} />
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <header className="w-full max-w-5xl flex justify-between items-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-800 tracking-tight">AI Answer Sheet Grader</h1>
          {appState !== AppState.UPLOAD_KEY && (
            <button
                onClick={resetApp}
                className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-red-600 transition-colors duration-300 flex items-center"
            >
                <BackspaceIcon className="w-5 h-5 mr-2" />
                Mulai Ulang
            </button>
          )}
      </header>
      <main className="w-full max-w-5xl flex-grow flex flex-col items-center justify-center bg-white p-6 sm:p-10 rounded-xl shadow-lg">
        {error && <div className="w-full max-w-2xl p-4 mb-6 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">{error}</div>}
        {renderContent()}
      </main>
      <footer className="w-full max-w-5xl text-center mt-8 text-slate-500 text-sm">
        <p>Powered by Gemini AI</p>
      </footer>
    </div>
  );
};

export default App;
