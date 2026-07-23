export interface TroopOption {
  id: string;
  troopCode: string;
  name: string;
  councilId: string;
  councilName: string;
}

export interface ScoutLevelOption {
  id: string;
  name: string;
  orderNumber: number;
}

export interface ListTroopsResponseBody {
  troops: TroopOption[];
}

export interface ListScoutLevelsResponseBody {
  scoutLevels: ScoutLevelOption[];
}
