import worldLandmassesJson from './worldLandmasses.json';

export interface Landmass {
  exterior: [number, number][];
  holes: [number, number][][];
}

export const worldLandmasses: Landmass[] = (worldLandmassesJson as unknown) as Landmass[];
