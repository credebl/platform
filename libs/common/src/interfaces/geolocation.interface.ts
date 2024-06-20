export interface CityInterface {
  id: number;
  name: string;
  stateId: number;
  stateCode: string;
  countryId: number;
  countryCode: string;
}

export interface CountryInterface {
  id: number;
  name: string;
  phonecode?: string;
  capital?: string;
}

export interface StateInterface {
  id: number;
  name: string;
  countryId: number;
  countryCode: string;
}
