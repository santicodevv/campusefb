export const getGradeColor = (grade: number | null) => {
  if (grade === null) return 'text-gray-400';
  if (grade < 5) return 'text-[#F89090] font-semibold';
  if (grade < 7) return 'text-[#FEC04B] font-semibold';
  if (grade < 8) return 'text-[#FEE54B] font-semibold';
  if (grade < 9) return 'text-[#C9E04A] font-semibold';
  if (grade <= 10) return 'text-[#1AC866] font-semibold';
  return 'text-gray-600 font-semibold';
};
