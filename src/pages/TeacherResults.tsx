import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Save, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  Section, 
  classesBySection, 
  subjectsBySection, 
  mockClassStudents,
  getGrade,
  skillRatings,
  nurserySkillCategories
} from "@/data/mockData";

interface StudentScore {
  id: string;
  name: string;
  ca1?: number;
  ca2?: number;
  exam?: number;
  total?: number;
  grade?: string;
  skillRating?: number;
}

const TeacherResults = () => {
  const { toast } = useToast();
  const [section, setSection] = useState<Section | "">("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState<StudentScore[]>([]);

  // Initialize students when filters change
  useEffect(() => {
    if (section && selectedClass) {
      setStudents(
        mockClassStudents.map((s) => ({
          ...s,
          ca1: undefined,
          ca2: undefined,
          exam: undefined,
          total: undefined,
          grade: undefined,
          skillRating: undefined,
        }))
      );
    }
  }, [section, selectedClass, selectedSubject]);

  const handleScoreChange = (
    studentId: string,
    field: "ca1" | "ca2" | "exam" | "skillRating",
    value: number
  ) => {
    setStudents((prev) =>
      prev.map((student) => {
        if (student.id !== studentId) return student;

        const updated = { ...student, [field]: value };

        // Auto-calculate total and grade for Primary/Secondary
        if (field !== "skillRating" && section !== "nursery") {
          const ca1 = updated.ca1 || 0;
          const ca2 = updated.ca2 || 0;
          const exam = updated.exam || 0;
          updated.total = ca1 + ca2 + exam;
          const gradeInfo = getGrade(updated.total, section as Section);
          updated.grade = gradeInfo.grade;
        }

        return updated;
      })
    );
  };

  const handleSave = () => {
    toast({
      title: "Results Saved",
      description: "All student results have been saved successfully.",
    });
  };

  const isNursery = section === "nursery";
  const showTable = section && selectedClass && (isNursery || selectedSubject);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Back Link */}
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portal
          </Link>

          {/* Page Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">
              Result Entry
            </h1>
            <p className="text-muted-foreground">
              Enter student results for the current term
            </p>
          </div>

          {/* Filters Card */}
          <Card className="mb-8 border-border shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Select Class & Subject</CardTitle>
              <CardDescription>
                Choose the section, class, and subject to begin entering results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Section */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Section</label>
                  <Select value={section} onValueChange={(v) => {
                    setSection(v as Section);
                    setSelectedClass("");
                    setSelectedSubject("");
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select section" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      <SelectItem value="nursery">Nursery</SelectItem>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Class */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Class</label>
                  <Select
                    value={selectedClass}
                    onValueChange={setSelectedClass}
                    disabled={!section}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border z-50">
                      {section &&
                        classesBySection[section].map((cls) => (
                          <SelectItem key={cls} value={cls}>
                            {cls}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject (only for Primary/Secondary) */}
                {!isNursery && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Subject</label>
                    <Select
                      value={selectedSubject}
                      onValueChange={setSelectedSubject}
                      disabled={!selectedClass || isNursery}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border z-50">
                        {section &&
                          subjectsBySection[section as Section].map((subj) => (
                            <SelectItem key={subj} value={subj}>
                              {subj}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Table */}
          {showTable && (
            <Card className="border-border shadow-soft animate-fade-in">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {isNursery
                      ? `Skills Assessment - ${selectedClass}`
                      : `${selectedSubject} - ${selectedClass}`}
                  </CardTitle>
                  <CardDescription>
                    {isNursery
                      ? "Rate each student's skill development"
                      : "Enter CA and Exam scores (Total: 100)"}
                  </CardDescription>
                </div>
                <Button onClick={handleSave} className="bg-gold text-primary hover:bg-gold-dark">
                  <Save className="w-4 h-4 mr-2" />
                  Save Results
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="font-semibold">S/N</TableHead>
                        <TableHead className="font-semibold min-w-[200px]">
                          Student Name
                        </TableHead>
                        {isNursery ? (
                          <TableHead className="font-semibold text-center">
                            Skill Rating
                          </TableHead>
                        ) : (
                          <>
                            <TableHead className="font-semibold text-center">
                              CA 1 (20)
                            </TableHead>
                            <TableHead className="font-semibold text-center">
                              CA 2 (20)
                            </TableHead>
                            <TableHead className="font-semibold text-center">
                              Exam (60)
                            </TableHead>
                            <TableHead className="font-semibold text-center">
                              Total
                            </TableHead>
                            <TableHead className="font-semibold text-center">
                              Grade
                            </TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student, idx) => (
                        <TableRow key={student.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium">{idx + 1}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>

                          {isNursery ? (
                            <TableCell>
                              <div className="flex items-center justify-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button
                                    key={star}
                                    type="button"
                                    onClick={() =>
                                      handleScoreChange(student.id, "skillRating", star)
                                    }
                                    className="p-1 transition-colors"
                                  >
                                    <Star
                                      className={`w-6 h-6 ${
                                        star <= (student.skillRating || 0)
                                          ? "fill-gold text-gold"
                                          : "text-muted-foreground/30"
                                      }`}
                                    />
                                  </button>
                                ))}
                                {student.skillRating && (
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    ({skillRatings.find((r) => r.value === student.skillRating)?.label})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          ) : (
                            <>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  placeholder="0"
                                  className="w-20 text-center mx-auto"
                                  value={student.ca1 ?? ""}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      student.id,
                                      "ca1",
                                      Math.min(20, parseInt(e.target.value) || 0)
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={20}
                                  placeholder="0"
                                  className="w-20 text-center mx-auto"
                                  value={student.ca2 ?? ""}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      student.id,
                                      "ca2",
                                      Math.min(20, parseInt(e.target.value) || 0)
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min={0}
                                  max={60}
                                  placeholder="0"
                                  className="w-20 text-center mx-auto"
                                  value={student.exam ?? ""}
                                  onChange={(e) =>
                                    handleScoreChange(
                                      student.id,
                                      "exam",
                                      Math.min(60, parseInt(e.target.value) || 0)
                                    )
                                  }
                                />
                              </TableCell>
                              <TableCell className="text-center font-semibold">
                                {student.total ?? "-"}
                              </TableCell>
                              <TableCell className="text-center">
                                {student.grade && (
                                  <span
                                    className={`px-2 py-1 rounded text-sm font-semibold ${
                                      student.grade.startsWith("A")
                                        ? "bg-green-100 text-green-700"
                                        : student.grade.startsWith("B")
                                        ? "bg-blue-100 text-blue-700"
                                        : student.grade.startsWith("C")
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    {student.grade}
                                  </span>
                                )}
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Legend for Nursery */}
                {isNursery && (
                  <div className="mt-6 p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold text-sm mb-3">Rating Scale:</h4>
                    <div className="flex flex-wrap gap-4">
                      {skillRatings.map((rating) => (
                        <div key={rating.value} className="flex items-center gap-2">
                          <div className="flex">
                            {[...Array(rating.value)].map((_, i) => (
                              <Star key={i} className="w-4 h-4 fill-gold text-gold" />
                            ))}
                          </div>
                          <span className="text-sm text-muted-foreground">= {rating.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherResults;
