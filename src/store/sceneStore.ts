import { create } from 'zustand';

interface SceneState {
  selectedScene: string;
  availableScenes: Array<{
    id: string;
    name: string;
    description: string;
    image: string;
    mapKey?: string;
  }>;
  setSelectedScene: (scene: string) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  selectedScene: 'town',
  availableScenes: [
    {
      id: 'town',
      name: '小镇',
      description: '一个宁静祥和的小镇场景',
      image: '/assets/scenes/town.svg', 
      mapKey: 'map'
    },
    {
      id: 'city',
      name: 'Pico-8城市',
      description: '一个复古风格的像素城市',
      image: '/assets/scenes/city.svg',
      mapKey: 'city-map'
    }
  ],
  setSelectedScene: (scene) => set({ selectedScene: scene }),
})); 