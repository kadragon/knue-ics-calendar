export interface Event {
  start: Date;
  end: Date;
  title: string;
  url?: string;
}

export interface Env {
  KNUE_CAL_KV: KVNamespace;
}