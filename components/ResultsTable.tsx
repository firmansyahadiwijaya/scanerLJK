
import React from 'react';
import type { GradedStudent } from '../types';
import { downloadCsv } from '../utils/fileUtils';
import { DocumentDownloadIcon } from './IconComponents';

interface ResultsTableProps {
  results: GradedStudent[];
}

const ResultsTable: React.FC<ResultsTableProps> = ({ results }) => {
  if (results.length === 0) {
    return (
      <div className="mt-6 text-center text-slate-500">
        <p>Belum ada jawaban siswa yang dipindai. Mulai pindai untuk melihat hasilnya di sini.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-slate-700">Hasil Penilaian</h2>
        <button
          onClick={() => downloadCsv(results)}
          className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-green-700 transition-colors duration-300 flex items-center"
        >
          <DocumentDownloadIcon className="w-5 h-5 mr-2" />
          Unduh CSV
        </button>
      </div>
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-100">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Siswa</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Pilihan Ganda</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">PG Kompleks</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Esai</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Total Skor</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {results.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">Siswa #{student.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.scores.multipleChoiceScore}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.scores.complexMultipleChoiceScore}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{student.scores.essayScore}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600">{student.scores.totalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ResultsTable;
