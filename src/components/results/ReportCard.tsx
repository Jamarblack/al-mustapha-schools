import { GraduationCap, Star } from "lucide-react";
import { 
  NurseryResult, 
  AcademicResult, 
  Section,
  primaryGradingScale,
  secondaryGradingScale 
} from "@/data/mockData";

interface ReportCardProps {
  variant: Section;
  data: NurseryResult | AcademicResult;
}

const ReportCard = ({ variant, data }: ReportCardProps) => {
  const isNursery = variant === "nursery";
  const isSecondary = variant === "secondary";
  const student = data.student;

  const gradingScale = isSecondary ? secondaryGradingScale : primaryGradingScale;

  return (
    <div className="bg-card border border-border rounded-lg shadow-elevated overflow-hidden print:shadow-none">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gold flex items-center justify-center">
              <GraduationCap className="w-8 h-8 md:w-10 md:h-10 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-xl md:text-2xl font-bold">
                AL-MUSTAPHA SCHOOLS
              </h1>
              <p className="text-primary-foreground/80 text-sm md:text-base">
                {isNursery
                  ? "Nursery Section"
                  : isSecondary
                  ? "College (Secondary Section)"
                  : "Primary Section"}
              </p>
              <p className="text-primary-foreground/60 text-xs md:text-sm">
                NO 1, AJAO MUSTAPHA STREET, IDI EMI OGIDI AREA., ILORIN, KWARA STATE
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-gold font-semibold">{student.term}</p>
            <p className="text-primary-foreground/80 text-sm">{student.session}</p>
          </div>
        </div>
      </div>

      {/* Title Bar */}
      <div className="bg-gold text-primary text-center py-3 font-display font-bold text-lg">
        {isNursery ? "DEVELOPMENTAL PROGRESS REPORT" : "STUDENT ACADEMIC REPORT"}
      </div>

      {/* Bio Data */}
      <div className="p-6 md:p-8 border-b border-border">
        <h3 className="font-display font-semibold text-lg mb-4 text-foreground">
          Student Information
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Full Name</p>
            <p className="font-semibold text-foreground">{student.name}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Admission No.</p>
            <p className="font-semibold text-foreground">{student.admissionNo}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Class</p>
            <p className="font-semibold text-foreground">{student.class}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Gender</p>
            <p className="font-semibold text-foreground">{student.gender}</p>
          </div>
          {isSecondary && student.department && (
            <div>
              <p className="text-muted-foreground">Department</p>
              <p className="font-semibold text-foreground">{student.department}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Date of Birth</p>
            <p className="font-semibold text-foreground">
              {new Date(student.dateOfBirth).toLocaleDateString("en-NG", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="p-6 md:p-8">
        {isNursery ? (
          // Nursery Skills Assessment
          <NurserySkillsTable data={data as NurseryResult} />
        ) : (
          // Primary/Secondary Academic Results
          <AcademicResultsTable data={data as AcademicResult} isSecondary={isSecondary} />
        )}
      </div>

      {/* Attendance & Remarks */}
      <div className="p-6 md:p-8 border-t border-border bg-muted/30">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Attendance */}
          <div>
            <h4 className="font-semibold text-foreground mb-2">Attendance</h4>
            <p className="text-sm text-muted-foreground">
              Present: <span className="font-semibold text-foreground">{data.attendance.present}</span> out of{" "}
              <span className="font-semibold text-foreground">{data.attendance.total}</span> days
            </p>
            <div className="mt-2 w-full bg-muted rounded-full h-2">
              <div
                className="bg-gold h-2 rounded-full"
                style={{ width: `${(data.attendance.present / data.attendance.total) * 100}%` }}
              />
            </div>
          </div>

          {/* Position (for Primary/Secondary) */}
          {!isNursery && "position" in data && (
            <div>
              <h4 className="font-semibold text-foreground mb-2">Class Position</h4>
              <p className="text-2xl font-display font-bold text-gold">{data.position}</p>
            </div>
          )}
        </div>

        {/* Remarks */}
        <div className="mt-6 grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-foreground mb-2">
              {isNursery ? "Teacher's Remark" : "Class Teacher's Remark"}
            </h4>
            <p className="text-sm text-muted-foreground italic bg-card p-3 rounded border border-border">
              "{isNursery ? (data as NurseryResult).teacherRemark : (data as AcademicResult).teacherRemark}"
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-foreground mb-2">
              {isNursery ? "Head Teacher's Remark" : "Principal's Remark"}
            </h4>
            <p className="text-sm text-muted-foreground italic bg-card p-3 rounded border border-border">
              "{isNursery ? (data as NurseryResult).headTeacherRemark : (data as AcademicResult).principalRemark}"
            </p>
          </div>
        </div>
      </div>

      {/* Grading Key (for Primary/Secondary) */}
      {!isNursery && (
        <div className="p-6 md:p-8 border-t border-border">
          <h4 className="font-semibold text-foreground mb-3">Grading Key</h4>
          <div className="flex flex-wrap gap-3">
            {gradingScale.map((g) => (
              <span key={g.grade} className="text-xs px-2 py-1 bg-muted rounded">
                {g.grade} ({g.min}-{g.max}): {g.remark}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="p-6 md:p-8 border-t border-border">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="border-t border-foreground/30 pt-2 mx-4">
              <p className="text-muted-foreground">Class Teacher</p>
            </div>
          </div>
          <div>
            <div className="border-t border-foreground/30 pt-2 mx-4">
              <p className="text-muted-foreground">
                {isNursery ? "Head Teacher" : "Vice Principal"}
              </p>
            </div>
          </div>
          <div>
            <div className="border-t border-foreground/30 pt-2 mx-4">
              <p className="text-muted-foreground">Principal</p>
            </div>
          </div>
        </div>
        <p className="text-center text-xs text-muted-foreground mt-6">
          This report card was generated electronically. For inquiries, contact the school administration.
        </p>
      </div>
    </div>
  );
};

// Nursery Skills Table Component
const NurserySkillsTable = ({ data }: { data: NurseryResult }) => {
  const groupedSkills = data.skills.reduce((acc, skill) => {
    if (!acc[skill.category]) acc[skill.category] = [];
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, typeof data.skills>);

  return (
    <div className="space-y-6">
      <h3 className="font-display font-semibold text-lg text-foreground">
        Developmental Skills Assessment
      </h3>
      
      {Object.entries(groupedSkills).map(([category, skills]) => (
        <div key={category} className="border border-border rounded-lg overflow-hidden">
          <div className="bg-primary/5 px-4 py-2 font-semibold text-foreground">
            {category}
          </div>
          <div className="divide-y divide-border">
            {skills.map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-foreground">{skill.skill}</span>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= skill.rating
                            ? "fill-gold text-gold"
                            : "text-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    skill.remark === "Excellent" ? "bg-green-100 text-green-700" :
                    skill.remark === "Very Good" ? "bg-blue-100 text-blue-700" :
                    skill.remark === "Good" ? "bg-yellow-100 text-yellow-700" :
                    "bg-orange-100 text-orange-700"
                  }`}>
                    {skill.remark}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Rating Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground p-4 bg-muted rounded-lg">
        <span className="font-semibold">Rating Scale:</span>
        {["Excellent (5★)", "Very Good (4★)", "Good (3★)", "Fair (2★)", "Needs Improvement (1★)"].map((r) => (
          <span key={r}>{r}</span>
        ))}
      </div>
    </div>
  );
};

// Academic Results Table Component
const AcademicResultsTable = ({ data, isSecondary }: { data: AcademicResult; isSecondary: boolean }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-semibold text-lg text-foreground">
          Academic Performance
        </h3>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Average Score</p>
          <p className="text-2xl font-bold text-gold">{data.averageScore.toFixed(1)}%</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-primary/5">
              <th className="text-left px-4 py-3 font-semibold text-foreground">Subject</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">CA 1 (20)</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">CA 2 (20)</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Exam (60)</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Total (100)</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Grade</th>
              <th className="text-center px-4 py-3 font-semibold text-foreground">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.subjects.map((subject, idx) => (
              <tr key={idx} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium text-foreground">{subject.subject}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{subject.ca1}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{subject.ca2}</td>
                <td className="px-4 py-3 text-center text-muted-foreground">{subject.exam}</td>
                <td className="px-4 py-3 text-center font-semibold text-foreground">{subject.total}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    subject.grade.startsWith("A") ? "bg-green-100 text-green-700" :
                    subject.grade.startsWith("B") ? "bg-blue-100 text-blue-700" :
                    subject.grade.startsWith("C") ? "bg-yellow-100 text-yellow-700" :
                    "bg-red-100 text-red-700"
                  }`}>
                    {subject.grade}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-muted-foreground text-xs">
                  {subject.remark}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gold/10 font-semibold">
              <td className="px-4 py-3 text-foreground">Total</td>
              <td colSpan={3}></td>
              <td className="px-4 py-3 text-center text-foreground">{data.totalScore}</td>
              <td colSpan={2}></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ReportCard;
