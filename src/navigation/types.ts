export type DrawerParamList = {
  Locations: undefined;
  Counts: undefined;
  Profile: undefined;
};

export type MainParamList = {
  Home: undefined;
  Assets: { locationId: number; name: string };
  AssetDetail: { id: number; code?: string };
  Scanner: { countId?: number } | undefined;
  CountDetail: { id: number; name: string };
  CountCreate: undefined;
};
