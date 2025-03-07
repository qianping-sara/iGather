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
    }
  ],
  setSelectedScene: (scene) => set({ selectedScene: scene }),
})); 