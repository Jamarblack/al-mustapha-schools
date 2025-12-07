// Mock data for Al-Mustapha School Group

export type Section = 'nursery' | 'primary' | 'secondary';

export interface Student {
  id: string;
  name: string;
  admissionNo: string;
  section: Section;
  class: string;
  department?: string;
  passport?: string;
  gender: 'Male' | 'Female';
  dateOfBirth: string;
  parentName: string;
  term: string;
  session: string;
}

export interface NurserySkill {
  skill: string;
  category: string;
  rating: 1 | 2 | 3 | 4 | 5;
  remark: 'Excellent' | 'Very Good' | 'Good' | 'Fair' | 'Needs Improvement';
}

export interface SubjectScore {
  subject: string;
  ca1: number;
  ca2: number;
  exam: number;
  total: number;
  grade: string;
  remark: string;
}

export interface NurseryResult {
  student: Student;
  skills: NurserySkill[];
  teacherRemark: string;
  headTeacherRemark: string;
  attendance: { present: number; total: number };
}

export interface AcademicResult {
  student: Student;
  subjects: SubjectScore[];
  totalScore: number;
  averageScore: number;
  position: string;
  teacherRemark: string;
  principalRemark: string;
  attendance: { present: number; total: number };
}

// Classes by section
export const classesBySection: Record<Section, string[]> = {
  nursery: ['Pre-Nursery', 'Nursery 1', 'Nursery 2', 'KG 1', 'KG 2'],
  primary: ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
  secondary: ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'],
};

export const subjectsBySection: Record<Section, string[]> = {
  nursery: [],
  primary: [
    'English Language',
    'Mathematics',
    'Basic Science',
    'Social Studies',
    'Religious Studies',
    'Civic Education',
    'Computer Studies',
    'Agricultural Science',
    'Physical & Health Education',
    'Creative Arts',
  ],
  secondary: [
    'English Language',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Economics',
    'Government',
    'Literature in English',
    'Computer Science',
    'Technical Drawing',
    'Further Mathematics',
  ],
};

export const nurserySkillCategories = [
  {
    category: 'Social & Emotional Development',
    skills: ['Plays well with others', 'Shares and takes turns', 'Follows classroom rules', 'Shows empathy'],
  },
  {
    category: 'Literacy Skills',
    skills: ['Recognizes letters', 'Phonics awareness', 'Writing readiness', 'Listening comprehension'],
  },
  {
    category: 'Numeracy Skills',
    skills: ['Number recognition', 'Counting (1-20)', 'Basic shapes', 'Pattern recognition'],
  },
  {
    category: 'Motor Skills',
    skills: ['Holds pencil correctly', 'Uses scissors', 'Colors within lines', 'Physical coordination'],
  },
];

// Mock Students
export const mockNurseryStudent: Student = {
  id: 'nur-001',
  name: 'Aisha Muhammad',
  admissionNo: 'NUR/2024/001',
  section: 'nursery',
  class: 'Nursery 2',
  gender: 'Female',
  dateOfBirth: '2020-03-15',
  parentName: 'Mr. & Mrs. Muhammad',
  term: 'First Term',
  session: '2024/2025',
};

export const mockPrimaryStudent: Student = {
  id: 'pri-001',
  name: 'Ibrahim Yusuf',
  admissionNo: 'PRI/2024/045',
  section: 'primary',
  class: 'Primary 5',
  gender: 'Male',
  dateOfBirth: '2015-08-22',
  parentName: 'Mr. Yusuf Abdullahi',
  term: 'First Term',
  session: '2024/2025',
};

export const mockSecondaryStudent: Student = {
  id: 'sec-001',
  name: 'Fatima Abubakar',
  admissionNo: 'SEC/2024/123',
  section: 'secondary',
  class: 'SS 2',
  department: 'Science',
  gender: 'Female',
  dateOfBirth: '2008-11-10',
  parentName: 'Dr. Abubakar Hassan',
  term: 'First Term',
  session: '2024/2025',
};

// Mock Results
export const mockNurseryResult: NurseryResult = {
  student: mockNurseryStudent,
  skills: [
    { skill: 'Plays well with others', category: 'Social & Emotional Development', rating: 5, remark: 'Excellent' },
    { skill: 'Shares and takes turns', category: 'Social & Emotional Development', rating: 4, remark: 'Very Good' },
    { skill: 'Follows classroom rules', category: 'Social & Emotional Development', rating: 5, remark: 'Excellent' },
    { skill: 'Shows empathy', category: 'Social & Emotional Development', rating: 4, remark: 'Very Good' },
    { skill: 'Recognizes letters', category: 'Literacy Skills', rating: 5, remark: 'Excellent' },
    { skill: 'Phonics awareness', category: 'Literacy Skills', rating: 4, remark: 'Very Good' },
    { skill: 'Writing readiness', category: 'Literacy Skills', rating: 3, remark: 'Good' },
    { skill: 'Listening comprehension', category: 'Literacy Skills', rating: 5, remark: 'Excellent' },
    { skill: 'Number recognition', category: 'Numeracy Skills', rating: 5, remark: 'Excellent' },
    { skill: 'Counting (1-20)', category: 'Numeracy Skills', rating: 5, remark: 'Excellent' },
    { skill: 'Basic shapes', category: 'Numeracy Skills', rating: 4, remark: 'Very Good' },
    { skill: 'Pattern recognition', category: 'Numeracy Skills', rating: 4, remark: 'Very Good' },
    { skill: 'Holds pencil correctly', category: 'Motor Skills', rating: 4, remark: 'Very Good' },
    { skill: 'Uses scissors', category: 'Motor Skills', rating: 3, remark: 'Good' },
    { skill: 'Colors within lines', category: 'Motor Skills', rating: 4, remark: 'Very Good' },
    { skill: 'Physical coordination', category: 'Motor Skills', rating: 5, remark: 'Excellent' },
  ],
  teacherRemark: 'Aisha is a delightful child who shows great enthusiasm for learning. She participates actively in class.',
  headTeacherRemark: 'Excellent progress! Keep up the good work.',
  attendance: { present: 58, total: 60 },
};

export const mockPrimaryResult: AcademicResult = {
  student: mockPrimaryStudent,
  subjects: [
    { subject: 'English Language', ca1: 18, ca2: 17, exam: 55, total: 90, grade: 'A', remark: 'Excellent' },
    { subject: 'Mathematics', ca1: 20, ca2: 18, exam: 50, total: 88, grade: 'A', remark: 'Excellent' },
    { subject: 'Basic Science', ca1: 17, ca2: 16, exam: 52, total: 85, grade: 'A', remark: 'Excellent' },
    { subject: 'Social Studies', ca1: 15, ca2: 18, exam: 48, total: 81, grade: 'A', remark: 'Excellent' },
    { subject: 'Religious Studies', ca1: 19, ca2: 17, exam: 55, total: 91, grade: 'A', remark: 'Excellent' },
    { subject: 'Civic Education', ca1: 16, ca2: 15, exam: 45, total: 76, grade: 'B', remark: 'Very Good' },
    { subject: 'Computer Studies', ca1: 18, ca2: 19, exam: 52, total: 89, grade: 'A', remark: 'Excellent' },
    { subject: 'Agricultural Science', ca1: 14, ca2: 16, exam: 48, total: 78, grade: 'B', remark: 'Very Good' },
    { subject: 'Physical & Health Education', ca1: 17, ca2: 18, exam: 50, total: 85, grade: 'A', remark: 'Excellent' },
    { subject: 'Creative Arts', ca1: 16, ca2: 17, exam: 47, total: 80, grade: 'A', remark: 'Excellent' },
  ],
  totalScore: 843,
  averageScore: 84.3,
  position: '3rd out of 45',
  teacherRemark: 'Ibrahim has shown remarkable improvement this term. He is dedicated and hardworking.',
  principalRemark: 'Excellent performance! Continue striving for excellence.',
  attendance: { present: 55, total: 60 },
};

export const mockSecondaryResult: AcademicResult = {
  student: mockSecondaryStudent,
  subjects: [
    { subject: 'English Language', ca1: 19, ca2: 18, exam: 58, total: 95, grade: 'A1', remark: 'Distinction' },
    { subject: 'Mathematics', ca1: 20, ca2: 19, exam: 55, total: 94, grade: 'A1', remark: 'Distinction' },
    { subject: 'Physics', ca1: 18, ca2: 17, exam: 52, total: 87, grade: 'A2', remark: 'Very Good' },
    { subject: 'Chemistry', ca1: 17, ca2: 18, exam: 54, total: 89, grade: 'A2', remark: 'Very Good' },
    { subject: 'Biology', ca1: 19, ca2: 18, exam: 56, total: 93, grade: 'A1', remark: 'Distinction' },
    { subject: 'Economics', ca1: 16, ca2: 17, exam: 48, total: 81, grade: 'B2', remark: 'Good' },
    { subject: 'Computer Science', ca1: 20, ca2: 19, exam: 58, total: 97, grade: 'A1', remark: 'Distinction' },
    { subject: 'Further Mathematics', ca1: 18, ca2: 17, exam: 50, total: 85, grade: 'B2', remark: 'Good' },
  ],
  totalScore: 721,
  averageScore: 90.1,
  position: '1st out of 120',
  teacherRemark: 'Fatima is an exceptional student with outstanding leadership qualities.',
  principalRemark: 'Outstanding performance! A role model for her peers.',
  attendance: { present: 58, total: 60 },
};

// Mock students for result entry
export const mockClassStudents = [
  { id: '1', name: 'Abubakar Ibrahim' },
  { id: '2', name: 'Aisha Musa' },
  { id: '3', name: 'Amina Yusuf' },
  { id: '4', name: 'Bashir Abdullahi' },
  { id: '5', name: 'Fatima Suleiman' },
  { id: '6', name: 'Hassan Mohammed' },
  { id: '7', name: 'Hauwa Usman' },
  { id: '8', name: 'Ibrahim Ahmad' },
  { id: '9', name: 'Khadija Bello' },
  { id: '10', name: 'Musa Aliyu' },
];

// Grading scales
export const primaryGradingScale = [
  { min: 70, max: 100, grade: 'A', remark: 'Excellent' },
  { min: 60, max: 69, grade: 'B', remark: 'Very Good' },
  { min: 50, max: 59, grade: 'C', remark: 'Good' },
  { min: 45, max: 49, grade: 'D', remark: 'Fair' },
  { min: 40, max: 44, grade: 'E', remark: 'Pass' },
  { min: 0, max: 39, grade: 'F', remark: 'Fail' },
];

export const secondaryGradingScale = [
  { min: 75, max: 100, grade: 'A1', remark: 'Distinction' },
  { min: 70, max: 74, grade: 'B2', remark: 'Very Good' },
  { min: 65, max: 69, grade: 'B3', remark: 'Good' },
  { min: 60, max: 64, grade: 'C4', remark: 'Credit' },
  { min: 55, max: 59, grade: 'C5', remark: 'Credit' },
  { min: 50, max: 54, grade: 'C6', remark: 'Credit' },
  { min: 45, max: 49, grade: 'D7', remark: 'Pass' },
  { min: 40, max: 44, grade: 'E8', remark: 'Pass' },
  { min: 0, max: 39, grade: 'F9', remark: 'Fail' },
];

export const getGrade = (total: number, section: Section): { grade: string; remark: string } => {
  const scale = section === 'secondary' ? secondaryGradingScale : primaryGradingScale;
  const found = scale.find((s) => total >= s.min && total <= s.max);
  return found ? { grade: found.grade, remark: found.remark } : { grade: 'F', remark: 'Fail' };
};

export const skillRatings = [
  { value: 5, label: 'Excellent' },
  { value: 4, label: 'Very Good' },
  { value: 3, label: 'Good' },
  { value: 2, label: 'Fair' },
  { value: 1, label: 'Needs Improvement' },
];
