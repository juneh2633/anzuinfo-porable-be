export interface ChartItem {
  chartIdx: number;
  targetScore: number | null;
}

export interface TierItem {
  tierIdx: number;
  tier: string;
  chartList: ChartItem[];
}

export interface PartInfo {
  partIdx: number;
  partName: string;
  description: string;
}

export interface PartItem {
  partInfo: PartInfo;
  tierList: TierItem[];
}

export interface TierlistData {
  data: PartItem[];
} 