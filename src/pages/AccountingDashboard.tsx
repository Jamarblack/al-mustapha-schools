import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Landmark, Receipt, TrendingUp, Wallet, CreditCard, Search, Plus, Loader2 } from "lucide-react";

const AccountingDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  // INTERACTIVE MOCK STATE
  const [metrics, setMetrics] = useState({ totalExpected: 2150000, totalCollected: 980000, outstanding: 1170000, expenses: 145000 });
  
  // Expanded to 20 realistic students across different classes
  const [students, setStudents] = useState([
    { id: 1, name: "Abdulazeez Yusuf", class: "Nursery 1", virtual_bank: "Wema Bank", virtual_account: "8273645211", account_name: "Al-Mustapha / Abdulazeez Y.", billed: 85000, paid: 85000, balance: 0, status: "Paid" },
    { id: 2, name: "Abdulhameed Hassana", class: "Basic 1", virtual_bank: "Moniepoint", virtual_account: "9012345678", account_name: "Al-Mustapha / Abdulhameed H.", billed: 95000, paid: 45000, balance: 50000, status: "Part Payment" },
    { id: 3, name: "Umar Ibrahim", class: "SS 1", virtual_bank: "Wema Bank", virtual_account: "8273645299", account_name: "Al-Mustapha / Umar I.", billed: 120000, paid: 0, balance: 120000, status: "Unpaid" },
    { id: 4, name: "Mustapha Muhizah", class: "JSS 2", virtual_bank: "Pending...", virtual_account: "Not Generated", account_name: "-", billed: 110000, paid: 0, balance: 110000, status: "No Account" },
    { id: 5, name: "Aisha Bello", class: "Basic 3", virtual_bank: "Moniepoint", virtual_account: "9012341122", account_name: "Al-Mustapha / Aisha B.", billed: 95000, paid: 95000, balance: 0, status: "Paid" },
    { id: 6, name: "Fatima Musa", class: "Basic 4", virtual_bank: "Pending...", virtual_account: "Not Generated", account_name: "-", billed: 95000, paid: 0, balance: 95000, status: "No Account" },
    { id: 7, name: "Kabiru Sani", class: "JSS 1", virtual_bank: "Wema Bank", virtual_account: "8273641123", account_name: "Al-Mustapha / Kabiru S.", billed: 110000, paid: 55000, balance: 55000, status: "Part Payment" },
    { id: 8, name: "Zainab Ali", class: "SS 2", virtual_bank: "Moniepoint", virtual_account: "9012343344", account_name: "Al-Mustapha / Zainab A.", billed: 125000, paid: 125000, balance: 0, status: "Paid" },
    { id: 9, name: "Abubakar Usman", class: "Basic 5", virtual_bank: "Wema Bank", virtual_account: "8273649988", account_name: "Al-Mustapha / Abubakar U.", billed: 95000, paid: 10000, balance: 85000, status: "Part Payment" },
    { id: 10, name: "Maryam Umar", class: "Nursery 2", virtual_bank: "Pending...", virtual_account: "Not Generated", account_name: "-", billed: 85000, paid: 0, balance: 85000, status: "No Account" },
    { id: 11, name: "Amina Suleiman", class: "JSS 3", virtual_bank: "Moniepoint", virtual_account: "9012345566", account_name: "Al-Mustapha / Amina S.", billed: 115000, paid: 115000, balance: 0, status: "Paid" },
    { id: 12, name: "Halima Abubakar", class: "SS 3", virtual_bank: "Wema Bank", virtual_account: "8273647766", account_name: "Al-Mustapha / Halima A.", billed: 130000, paid: 0, balance: 130000, status: "Unpaid" },
    { id: 13, name: "Usman Danjuma", class: "Basic 2", virtual_bank: "Pending...", virtual_account: "Not Generated", account_name: "-", billed: 95000, paid: 0, balance: 95000, status: "No Account" },
    { id: 14, name: "Khadija Mohammed", class: "Nursery 1", virtual_bank: "Moniepoint", virtual_account: "9012347788", account_name: "Al-Mustapha / Khadija M.", billed: 85000, paid: 40000, balance: 45000, status: "Part Payment" },
    { id: 15, name: "Yusuf Ibrahim", class: "Basic 4", virtual_bank: "Wema Bank", virtual_account: "8273645544", account_name: "Al-Mustapha / Yusuf I.", billed: 95000, paid: 95000, balance: 0, status: "Paid" },
    { id: 16, name: "Hafsat Tariq", class: "JSS 1", virtual_bank: "Pending...", virtual_account: "Not Generated", account_name: "-", billed: 110000, paid: 0, balance: 110000, status: "No Account" },
    { id: 17, name: "Idris Bashir", class: "SS 1", virtual_bank: "Moniepoint", virtual_account: "9012349900", account_name: "Al-Mustapha / Idris B.", billed: 120000, paid: 60000, balance: 60000, status: "Part Payment" },
    { id: 18, name: "Rukaiya Sadiq", class: "Basic 1", virtual_bank: "Wema Bank", virtual_account: "8273643322", account_name: "Al-Mustapha / Rukaiya S.", billed: 95000, paid: 0, balance: 95000, status: "Unpaid" },
    { id: 19, name: "Salisu Garba", class: "SS 2", virtual_bank: "Moniepoint", virtual_account: "9012342211", account_name: "Al-Mustapha / Salisu G.", billed: 125000, paid: 125000, balance: 0, status: "Paid" },
    { id: 20, name: "Hauwa Bello", class: "Basic 5", virtual_bank: "Pending...", virtual_account: "Not Generated", account_name: "-", billed: 95000, paid: 0, balance: 95000, status: "No Account" },
  ]);

  const [transactions, setTransactions] = useState([
    { id: "TRX-001", date: "Aug 9, 2026 08:15 AM", student: "Abdulazeez Yusuf", type: "Virtual Transfer", amount: 85000, status: "Successful" },
    { id: "TRX-002", date: "Aug 8, 2026 02:30 PM", student: "Abdulhameed Hassana", type: "Virtual Transfer", amount: 45000, status: "Successful" },
    { id: "TRX-003", date: "Aug 7, 2026 10:11 AM", student: "Aisha Bello", type: "Virtual Transfer", amount: 95000, status: "Successful" },
    { id: "TRX-004", date: "Aug 6, 2026 01:45 PM", student: "Kabiru Sani", type: "Virtual Transfer", amount: 55000, status: "Successful" },
    { id: "TRX-005", date: "Aug 5, 2026 09:20 AM", student: "Zainab Ali", type: "Virtual Transfer", amount: 125000, status: "Successful" },
  ]);

  const [expenses, setExpenses] = useState([
    { id: "EXP-001", date: "Aug 5, 2026", title: "Generator Diesel (100 Liters)", category: "Utility", amount: 120000 },
    { id: "EXP-002", date: "Aug 1, 2026", title: "Chalk & Whiteboard Markers", category: "Supplies", amount: 25000 },
  ]);

  // NEW MOCK INPUT STATES
  const [newPayment, setNewPayment] = useState({ studentId: "", amount: "" });
  const [newExpense, setNewExpense] = useState({ title: "", category: "", amount: "" });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "Paid": return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Fully Paid</Badge>;
      case "Part Payment": return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">Part Payment</Badge>;
      case "Unpaid": return <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Unpaid</Badge>;
      default: return <Badge variant="outline" className="text-gray-500">No Account</Badge>;
    }
  };

  const handleGenerateAccount = (id: number) => {
    setLoading(true);
    setTimeout(() => { 
        setStudents(students.map(s => s.id === id ? { ...s, virtual_account: "899" + Math.floor(1000000 + Math.random() * 9000000), virtual_bank: "Moniepoint", account_name: `Al-Mustapha / ${s.name}`, status: s.status === "No Account" ? "Unpaid" : s.status } : s));
        setLoading(false); 
        toast({ title: "Generated", description: "Virtual Account created successfully!" }); 
    }, 1000);
  };

  const handleLogPayment = () => {
      const student = students.find(s => s.id.toString() === newPayment.studentId);
      if (!student || !newPayment.amount) return;
      
      const amountNum = Number(newPayment.amount);
      
      // Update Student
      const updatedStudents = students.map(s => {
          if (s.id.toString() === newPayment.studentId) {
              const newPaid = s.paid + amountNum;
              const newBalance = s.billed - newPaid;
              return { ...s, paid: newPaid, balance: newBalance, status: newBalance <= 0 ? "Paid" : "Part Payment" };
          }
          return s;
      });
      setStudents(updatedStudents);

      
      setTransactions([{ id: `TRX-00${transactions.length + 1}`, date: new Date().toLocaleString(), student: student.name, type: "Manual Logging", amount: amountNum, status: "Successful" }, ...transactions]);
      
      
      setMetrics({ ...metrics, totalCollected: metrics.totalCollected + amountNum, outstanding: metrics.outstanding - amountNum });
      
      toast({ title: "Payment Logged", description: `${formatCurrency(amountNum)} added to ${student.name}.` });
      setPaymentModalOpen(false);
      setNewPayment({ studentId: "", amount: "" });
  };

  const handleLogExpense = () => {
      if (!newExpense.title || !newExpense.amount) return;
      const amountNum = Number(newExpense.amount);

      setExpenses([{ id: `EXP-00${expenses.length + 1}`, date: new Date().toLocaleDateString(), title: newExpense.title, category: newExpense.category, amount: amountNum }, ...expenses]);
      setMetrics({ ...metrics, expenses: metrics.expenses + amountNum });
      
      toast({ title: "Expense Logged", description: "School expense has been recorded." });
      setExpenseModalOpen(false);
      setNewExpense({ title: "", category: "", amount: "" });
  };

  
  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.class.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b px-6 py-4 flex justify-between sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-900 rounded-full flex items-center justify-center text-white font-bold"><Landmark className="w-5 h-5"/></div>
            <div><h1 className="font-bold text-teal-900">Al-Mustapha Finance</h1><p className="text-xs text-slate-500">Bursary Portal</p></div>
        </div>
        <Button variant="destructive" size="sm" onClick={() => navigate('/login')}><LogOut className="w-4 h-4 mr-2"/> Logout</Button>
      </header>

      <main className="p-4 md:p-6 container mx-auto max-w-6xl">
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="flex flex-wrap h-auto p-1 bg-slate-200/50 justify-start">
                <TabsTrigger value="overview" className="data-[state=active]:bg-teal-900 data-[state=active]:text-white"><TrendingUp className="w-4 h-4 mr-2"/> Overview</TabsTrigger>
                <TabsTrigger value="students" className="data-[state=active]:bg-teal-900 data-[state=active]:text-white"><CreditCard className="w-4 h-4 mr-2"/> Debtors & Accounts</TabsTrigger>
                <TabsTrigger value="transactions" className="data-[state=active]:bg-teal-900 data-[state=active]:text-white"><Receipt className="w-4 h-4 mr-2"/> Transactions</TabsTrigger>
                <TabsTrigger value="expenses" className="data-[state=active]:bg-teal-900 data-[state=active]:text-white"><Wallet className="w-4 h-4 mr-2"/> Expenses</TabsTrigger>
            </TabsList>

            {/* OVERVIEW TAB */}
            <TabsContent value="overview">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="border-l-4 border-l-teal-600 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-gray-500 uppercase">Expected Revenue</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-slate-800">{formatCurrency(metrics.totalExpected)}</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-green-500 shadow-sm bg-green-50">
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-green-700 uppercase">Total Collected</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-green-700">{formatCurrency(metrics.totalCollected)}</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-orange-500 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-orange-600 uppercase">Outstanding Debt</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-orange-600">{formatCurrency(metrics.outstanding)}</p></CardContent>
                    </Card>
                    <Card className="border-l-4 border-l-red-500 shadow-sm">
                        <CardHeader className="pb-2"><CardTitle className="text-xs text-red-600 uppercase">Total Expenses</CardTitle></CardHeader>
                        <CardContent><p className="text-2xl font-bold text-red-600">{formatCurrency(metrics.expenses)}</p></CardContent>
                    </Card>
                </div>
            </TabsContent>

            {/* STUDENTS & VIRTUAL ACCOUNTS TAB */}
            <TabsContent value="students">
                <Card>
                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-2 gap-4">
                        <div>
                            <CardTitle>Debtors & Virtual Accounts</CardTitle>
                            <CardDescription>Manage automated bank accounts and manual payments. Showing {filteredStudents.length} students.</CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            <div className="relative">
                                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                                <Input placeholder="Search student or class..." className="pl-9 w-full sm:w-[200px]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                            </div>
                            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                                <DialogTrigger asChild><Button className="bg-teal-900 hover:bg-teal-800"><Plus className="w-4 h-4 mr-2"/> Log Manual Payment</Button></DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Log Manual Cash/Transfer</DialogTitle></DialogHeader>
                                    <div className="space-y-4 pt-4">
                                        <div>
                                            <Label>Select Student</Label>
                                            <Select value={newPayment.studentId} onValueChange={v => setNewPayment({...newPayment, studentId: v})}>
                                                <SelectTrigger><SelectValue placeholder="Search name..."/></SelectTrigger>
                                                <SelectContent className="max-h-[200px]">
                                                    {students.filter(s => s.balance > 0).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name} - Bal: {formatCurrency(s.balance)}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label>Amount Paid (NGN)</Label>
                                            <Input type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} placeholder="e.g. 50000" />
                                        </div>
                                        <Button onClick={handleLogPayment} className="w-full bg-teal-900 hover:bg-teal-800">Save Payment & Print Receipt</Button>
                                    </div>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border h-[500px] overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm">
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Virtual Account</TableHead>
                                        <TableHead>Total Billed</TableHead>
                                        <TableHead>Balance</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredStudents.length > 0 ? filteredStudents.map((student) => (
                                        <TableRow key={student.id}>
                                            <TableCell>
                                                <div className="font-medium">{student.name}</div>
                                                <div className="text-xs text-gray-500">{student.class}</div>
                                            </TableCell>
                                            <TableCell>
                                                {student.virtual_account !== "Not Generated" ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-teal-800">{student.virtual_bank} - <span className="font-mono text-sm">{student.virtual_account}</span></span>
                                                        <span className="text-[10px] text-gray-500">{student.account_name}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-400 italic">No account assigned</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium">{formatCurrency(student.billed)}</TableCell>
                                            <TableCell className={`font-bold ${student.balance > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(student.balance)}</TableCell>
                                            <TableCell>{getStatusBadge(student.status)}</TableCell>
                                            <TableCell>
                                                {student.virtual_account === "Not Generated" && (
                                                    <Button size="sm" onClick={() => handleGenerateAccount(student.id)} disabled={loading} className="bg-teal-900 hover:bg-teal-800 text-xs">
                                                        {loading ? <Loader2 className="w-3 h-3 animate-spin"/> : "Generate Account"}
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-gray-500">No students found matching your search.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* TRANSACTIONS TAB */}
            <TabsContent value="transactions">
                <Card>
                    <CardHeader><CardTitle>Payment History</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Student</TableHead><TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {transactions.map((trx) => (
                                    <TableRow key={trx.id}>
                                        <TableCell className="font-mono text-xs text-gray-500">{trx.id}</TableCell>
                                        <TableCell className="text-sm">{trx.date}</TableCell>
                                        <TableCell className="font-medium text-teal-900">{trx.student}</TableCell>
                                        <TableCell><Badge variant="outline" className="bg-teal-50 text-teal-700">{trx.type}</Badge></TableCell>
                                        <TableCell className="text-right font-bold text-green-600">+{formatCurrency(trx.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>

            {/* EXPENSES TAB */}
            <TabsContent value="expenses">
                <Card>
                    <CardHeader className="flex flex-row justify-between items-center pb-2">
                        <CardTitle>School Expenses</CardTitle>
                        <Dialog open={expenseModalOpen} onOpenChange={setExpenseModalOpen}>
                            <DialogTrigger asChild><Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-50"><Plus className="w-4 h-4 mr-2"/> Add Expense</Button></DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Record New Expense</DialogTitle></DialogHeader>
                                <div className="space-y-4 pt-4">
                                    <div><Label>Expense Title</Label><Input placeholder="e.g. Generator Fuel" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} /></div>
                                    <div>
                                        <Label>Category</Label>
                                        <Select value={newExpense.category} onValueChange={v => setNewExpense({...newExpense, category: v})}>
                                            <SelectTrigger><SelectValue placeholder="Select Category"/></SelectTrigger>
                                            <SelectContent><SelectItem value="Utility">Utility</SelectItem><SelectItem value="Maintenance">Maintenance</SelectItem><SelectItem value="Salary">Salary</SelectItem><SelectItem value="Supplies">Supplies</SelectItem></SelectContent>
                                        </Select>
                                    </div>
                                    <div><Label>Amount (NGN)</Label><Input type="number" placeholder="e.g. 15000" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: e.target.value})} /></div>
                                    <Button onClick={handleLogExpense} className="w-full bg-red-600 hover:bg-red-700">Record Expense</Button>
                                </div>
                            </DialogContent>
                        </Dialog>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {expenses.map((exp) => (
                                    <TableRow key={exp.id}>
                                        <TableCell className="font-mono text-xs text-gray-500">{exp.id}</TableCell>
                                        <TableCell className="text-sm">{exp.date}</TableCell>
                                        <TableCell className="font-medium text-slate-800">{exp.title}</TableCell>
                                        <TableCell><Badge variant="secondary">{exp.category}</Badge></TableCell>
                                        <TableCell className="text-right font-bold text-red-600">-{formatCurrency(exp.amount)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AccountingDashboard;