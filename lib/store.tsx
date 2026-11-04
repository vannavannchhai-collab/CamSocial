"use client";

// ============================================================================
// Global payroll store — React context + localStorage persistence.
// All amounts are stored in KHR. A single source of truth feeds every page,
// every report and the PDF/CSV exporters.
// ============================================================================

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  AttendanceRecord,
  Department,
  Employee,
  LeaveRequest,
  PayrollRun,
  PayrollSettings,
  Payslip,
  Position,
} from "./types";
import { DEFAULT_SETTINGS } from "./payroll/cambodia";
import { calculatePayslip } from "./payroll/calc";
import { attendanceSummaryFor } from "./payroll/attendance";
import type { AttendanceSummary } from "./payroll/calc";
import { uid } from "./format";

const STORAGE_KEY = "khmerpayroll.v2";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone: "success" | "error" | "info";
}

interface PersistedState {
  employees: Employee[];
  departments: Department[];
  positions: Position[];
  runs: PayrollRun[];
  payslips: Payslip[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  settings: PayrollSettings;
  advances: Record<string, number>;
}

interface StoreValue extends PersistedState {
  ready: boolean;
  activeRunId: string;
  setActiveRunId: (id: string) => void;
  activeRun: PayrollRun | undefined;
  activePayslips: Payslip[];
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: string) => void;

  // employees
  addEmployee: (e: Employee) => void;
  updateEmployee: (id: string, patch: Partial<Employee>) => void;
  removeEmployee: (id: string) => void;

  // runs
  addRun: (r: PayrollRun) => void;
  updateRun: (id: string, patch: Partial<PayrollRun>) => void;

  // payslips
  recalculateRun: (runId: string) => void;
  setPayslips: (runId: string, slips: Payslip[]) => void;

  // settings / org
  updateSettings: (patch: Partial<PayrollSettings>) => void;
  addDepartment: (d: Department) => void;
  updateDepartment: (id: string, patch: Partial<Department>) => void;
  removeDepartment: (id: string) => void;
  addPosition: (p: Position) => void;
  updatePosition: (id: string, patch: Partial<Position>) => void;
  removePosition: (id: string) => void;

  // attendance / leave
  attendanceSummary: (employeeId: string, runId?: string) => AttendanceSummary;
  addLeave: (l: LeaveRequest) => void;
  reviewLeave: (id: string, status: "approved" | "rejected") => void;

  // utils
  employeeById: (id: string) => Employee | undefined;
  departmentById: (id: string) => Department | undefined;
  positionById: (id: string) => Position | undefined;
  clearAllData: () => void;
  setAdvances: (v: Record<string, number>) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function buildInitial(): PersistedState {
  // No demo data — the system starts completely empty so the company can
  // enter its own departments, positions, employees and payroll runs.
  return {
    employees: [],
    departments: [],
    positions: [],
    runs: [],
    payslips: [],
    attendance: [],
    leaves: [],
    settings: { ...DEFAULT_SETTINGS },
    advances: {},
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => buildInitial());
  const [ready, setReady] = useState(false);
  const [activeRunId, setActiveRunId] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const loadedRef = useRef(false);

  // ---------- hydrate ----------
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as PersistedState;
        if (parsed?.employees?.length) {
          setState({
            ...parsed,
            settings: { ...DEFAULT_SETTINGS, ...parsed.settings, company: { ...DEFAULT_SETTINGS.company, ...parsed.settings?.company } },
          });
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    const now = new Date();
    setActiveRunId(`run_${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, "0")}`);
    setReady(true);
  }, []);

  // ---------- persist ----------
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        /* quota */
      }
    }, 250);
    return () => clearTimeout(t);
  }, [state, ready]);

  // ---------- toasts ----------
  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== id)), 4200);
  }, []);
  const dismissToast = useCallback(
    (id: string) => setToasts((prev) => prev.filter((x) => x.id !== id)),
    []
  );

  // ---------- derived ----------
  const runsSorted = useMemo(
    () =>
      [...state.runs].sort(
        (a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth
      ),
    [state.runs]
  );

  const activeRun = useMemo(
    () => state.runs.find((r) => r.id === activeRunId) ?? runsSorted[0],
    [state.runs, activeRunId, runsSorted]
  );

  const activePayslips = useMemo(() => {
    if (!activeRun) return [];
    return state.payslips.filter((s) => s.runId === activeRun.id);
  }, [state.payslips, activeRun]);

  // ---------- mutations ----------
  const recalcInternal = useCallback(
    (st: PersistedState, runId: string): Payslip[] => {
      const run = st.runs.find((r) => r.id === runId);
      if (!run) return [];
      return st.employees
        .filter((e) => e.status !== "resigned" && e.status !== "terminated")
        .map((e) => {
          const att = attendanceSummaryFor(e.id, run, st.attendance);
          const months = Math.max(
            0,
            (run.periodYear - new Date(e.hireDate).getFullYear()) * 12 +
              (run.periodMonth - (new Date(e.hireDate).getMonth() + 1))
          );
          const slip = calculatePayslip({
            employee: e,
            run,
            settings: st.settings,
            attendance: att,
            advanceRepayment: st.advances[e.id],
            includeSeniority:
              run.periodMonth === 12 && e.employmentType === "permanent",
            monthsOfService: months,
          });
          return { ...slip, runId: run.id };
        });
    },
    []
  );

  const recalculateRun = useCallback(
    (runId: string) => {
      setState((st) => {
        const fresh = recalcInternal(st, runId);
        return {
          ...st,
          payslips: [...st.payslips.filter((s) => s.runId !== runId), ...fresh],
        };
      });
      toast({ title: "គណនាបៀវត្សរ៍ឡើងវិញរួចរាល់", description: "បានធ្វើបច្ចុប្បន្នភាពប័ណ្ណបៀវត្សរ៍ទាំងអស់", tone: "success" });
    },
    [recalcInternal, toast]
  );

  const addEmployee = useCallback(
    (e: Employee) => {
      setState((st) => {
        const next = { ...st, employees: [...st.employees, e] };
        if (st.runs[0]) {
          const runId = [...st.runs].sort((a, b) => b.periodYear - a.periodYear || b.periodMonth - a.periodMonth)[0].id;
          const fresh = recalcInternal(next, runId);
          next.payslips = [...st.payslips.filter((s) => s.runId !== runId), ...fresh];
        }
        return next;
      });
      toast({ title: "បានបន្ថែមបុគ្គលិកថ្មី", description: e.code, tone: "success" });
    },
    [recalcInternal, toast]
  );

  const updateEmployee = useCallback(
    (id: string, patch: Partial<Employee>) => {
      setState((st) => ({
        ...st,
        employees: st.employees.map((e) => (e.id === id ? { ...e, ...patch } : e)),
      }));
    },
    []
  );

  const removeEmployee = useCallback(
    (id: string) => {
      setState((st) => ({
        ...st,
        employees: st.employees.filter((e) => e.id !== id),
        payslips: st.payslips.filter((s) => s.employeeId !== id),
      }));
      toast({ title: "បានលុបបុគ្គលិក", tone: "info" });
    },
    [toast]
  );

  const addRun = useCallback(
    (r: PayrollRun) => {
      setState((st) => {
        if (st.runs.some((x) => x.id === r.id)) return st;
        const next = { ...st, runs: [...st.runs, r] };
        const fresh = recalcInternal(next, r.id);
        next.payslips = [...st.payslips, ...fresh];
        return next;
      });
      setActiveRunId(r.id);
      toast({ title: "បានបង្កើតវដ្តបៀវត្សរ៍ថ្មី", description: r.code, tone: "success" });
    },
    [recalcInternal, toast]
  );

  const updateRun = useCallback((id: string, patch: Partial<PayrollRun>) => {
    setState((st) => ({
      ...st,
      runs: st.runs.map((r) => (r.id === id ? { ...r, ...patch } : r)),
    }));
  }, []);

  const setPayslips = useCallback((runId: string, slips: Payslip[]) => {
    setState((st) => ({
      ...st,
      payslips: [...st.payslips.filter((s) => s.runId !== runId), ...slips],
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<PayrollSettings>) => {
    setState((st) => ({ ...st, settings: { ...st.settings, ...patch } }));
  }, []);

  const addDepartment = useCallback((d: Department) => {
    setState((st) => ({ ...st, departments: [...st.departments, d] }));
  }, []);

  const updateDepartment = useCallback((id: string, patch: Partial<Department>) => {
    setState((st) => ({
      ...st,
      departments: st.departments.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  }, []);

  const removeDepartment = useCallback(
    (id: string) => {
      setState((st) => {
        if (st.employees.some((e) => e.departmentId === id)) return st; // in use
        return { ...st, departments: st.departments.filter((d) => d.id !== id) };
      });
    },
    []
  );

  const addPosition = useCallback((p: Position) => {
    setState((st) => ({ ...st, positions: [...st.positions, p] }));
  }, []);

  const updatePosition = useCallback((id: string, patch: Partial<Position>) => {
    setState((st) => ({
      ...st,
      positions: st.positions.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
  }, []);

  const removePosition = useCallback(
    (id: string) => {
      setState((st) => {
        if (st.employees.some((e) => e.positionId === id)) return st; // in use
        return { ...st, positions: st.positions.filter((p) => p.id !== id) };
      });
    },
    []
  );

  const addLeave = useCallback(
    (l: LeaveRequest) => {
      setState((st) => ({ ...st, leaves: [l, ...st.leaves] }));
      toast({ title: "បានដាក់ពាក្យសុំច្បាប់", tone: "success" });
    },
    [toast]
  );

  const reviewLeave = useCallback(
    (id: string, status: "approved" | "rejected") => {
      setState((st) => ({
        ...st,
        leaves: st.leaves.map((l) => (l.id === id ? { ...l, status } : l)),
      }));
      toast({
        title: status === "approved" ? "បានអនុម័តច្បាប់" : "បានបដិសេធច្បាប់",
        tone: status === "approved" ? "success" : "info",
      });
    },
    [toast]
  );

  const attendanceSummary = useCallback(
    (employeeId: string, runId?: string) => {
      const run = state.runs.find((r) => r.id === (runId ?? activeRun?.id));
      if (!run) {
        return {
          daysWorked: 22, paidLeaveDays: 0, unpaidLeaveDays: 0, absentDays: 0, lateCount: 0,
          overtimeWeekday: 0, overtimeRestDay: 0, overtimeHoliday: 0, totalOvertimeHours: 0,
        };
      }
      return attendanceSummaryFor(employeeId, run, state.attendance);
    },
    [state.runs, state.employees, activeRun]
  );

  const clearAllData = useCallback(() => {
    setState(buildInitial());
    setActiveRunId("");
    toast({ title: "បានសម្អាតទិន្នន័យទាំងអស់", description: "ប្រព័ន្ធចាប់ផ្តើមថ្មីដោយគ្មានទិន្នន័យ", tone: "info" });
  }, [toast]);

  const employeeById = useCallback(
    (id: string) => state.employees.find((e) => e.id === id),
    [state.employees]
  );
  const departmentById = useCallback(
    (id: string) => state.departments.find((d) => d.id === id),
    [state.departments]
  );
  const positionById = useCallback(
    (id: string) => state.positions.find((p) => p.id === id),
    [state.positions]
  );

  const setAdvances = useCallback((v: Record<string, number>) => {
    setState((st) => ({ ...st, advances: v }));
  }, []);

  const value: StoreValue = {
    ...state,
    ready,
    activeRunId: activeRun?.id ?? "",
    setActiveRunId,
    activeRun,
    activePayslips,
    toasts,
    toast,
    dismissToast,
    addEmployee,
    updateEmployee,
    removeEmployee,
    addRun,
    updateRun,
    recalculateRun,
    setPayslips,
    updateSettings,
    addDepartment,
    updateDepartment,
    removeDepartment,
    addPosition,
    updatePosition,
    removePosition,
    attendanceSummary,
    addLeave,
    reviewLeave,
    employeeById,
    departmentById,
    positionById,
    clearAllData,
    setAdvances,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>");
  return ctx;
}
