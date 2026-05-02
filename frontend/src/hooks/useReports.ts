import { useState, useCallback } from 'react';
import {
  getReport1,
  getReport2,
  getReport3,
  getReport4,
  getReport5,
  getReport6,
  getReport7,
} from '../api/reports.api';
import { FINE_SCHEDULE } from '../constants/fineSchedule';
import type { ViolationTypeEnum } from '../constants/enums';

export type ReportId = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Report1Params { license_type?: string; license_status?: string; sex?: string; age_min?: number; age_max?: number; }
export interface Report2Params { license_number: string; }
export interface Report3Params { as_of_date: string; }
export interface Report4Params {}
export interface Report5Params { license_number: string; start_date?: string; end_date?: string; }
export interface Report6Params { year: number; }
export interface Report7Params { city?: string; region?: string; }

export type ReportParams =
  | Report1Params | Report2Params | Report3Params | Report4Params
  | Report5Params | Report6Params | Report7Params;

export type ReportResult = {
  rows:    any[];
  loading: boolean;
  error:   string | null;
};

export function useReport1() {
  const [state, setState] = useState<ReportResult>({ rows: [], loading: false, error: null });

  const run = useCallback(async (params: Report1Params) => {
    setState({ rows: [], loading: true, error: null });
    try {
      const rows = await getReport1(params);
      setState({ rows, loading: false, error: null });
    } catch (err: any) {
      setState({ rows: [], loading: false, error: err.message ?? 'Report failed' });
    }
  }, []);

  return { ...state, run };
}

export function useReport2() {
  const [state, setState] = useState<ReportResult>({ rows: [], loading: false, error: null });

  const run = useCallback(async (params: Report2Params) => {
    setState({ rows: [], loading: true, error: null });
    try {
      const rows = await getReport2(params.license_number);
      setState({ rows, loading: false, error: null });
    } catch (err: any) {
      setState({ rows: [], loading: false, error: err.message ?? 'Report failed' });
    }
  }, []);

  return { ...state, run };
}

export function useReport3() {
  const [state, setState] = useState<ReportResult>({ rows: [], loading: false, error: null });

  const run = useCallback(async (params: Report3Params) => {
    setState({ rows: [], loading: true, error: null });
    try {
      const rows = await getReport3(params.as_of_date);
      setState({ rows, loading: false, error: null });
    } catch (err: any) {
      setState({ rows: [], loading: false, error: err.message ?? 'Report failed' });
    }
  }, []);

  return { ...state, run };
}

export function useReport4() {
  const [state, setState] = useState<ReportResult>({ rows: [], loading: false, error: null });

  const run = useCallback(async () => {
    setState({ rows: [], loading: true, error: null });
    try {
      const rows = await getReport4();
      setState({ rows, loading: false, error: null });
    } catch (err: any) {
      setState({ rows: [], loading: false, error: err.message ?? 'Report failed' });
    }
  }, []);

  return { ...state, run };
}

export function useReport5() {
  const [state, setState] = useState<ReportResult>({ rows: [], loading: false, error: null });

  const run = useCallback(async (params: Report5Params) => {
    setState({ rows: [], loading: true, error: null });
    try {
      const rows = await getReport5(params);
      setState({ rows, loading: false, error: null });
    } catch (err: any) {
      setState({ rows: [], loading: false, error: err.message ?? 'Report failed' });
    }
  }, []);

  return { ...state, run };
}

export function useReport6() {
  const [state, setState] = useState<ReportResult>({ rows: [], loading: false, error: null });

  const run = useCallback(async (params: Report6Params) => {
    setState({ rows: [], loading: true, error: null });
    try {
      const raw = await getReport6(params.year);
      const rows = raw.map((r: any) => {
        const count = Number(r.total_violations ?? r.total_count ?? 0);
        return {
          violation_type: r.violation_type,
          total_count:    count,
          total_fine:     (FINE_SCHEDULE[r.violation_type as ViolationTypeEnum] ?? 0) * count,
        };
      });
      setState({ rows, loading: false, error: null });
    } catch (err: any) {
      setState({ rows: [], loading: false, error: err.message ?? 'Report failed' });
    }
  }, []);

  return { ...state, run };
}

export function useReport7() {
  const [state, setState] = useState<ReportResult>({ rows: [], loading: false, error: null });

  const run = useCallback(async (params: Report7Params) => {
    setState({ rows: [], loading: true, error: null });
    try {
      const rows = await getReport7(params);
      setState({ rows, loading: false, error: null });
    } catch (err: any) {
      setState({ rows: [], loading: false, error: err.message ?? 'Report failed' });
    }
  }, []);

  return { ...state, run };
}