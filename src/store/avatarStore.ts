import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Avatar {
  id: string;
  name: string;
  image: string;
}

interface AvatarState {
  selectedAvatar: string;
  availableAvatars: Avatar[];
  setSelectedAvatar: (avatarId: string) => void;
}

// 基本角色
const baseAvatars: Avatar[] = [
  {
    id: 'default',
    name: '默认角色',
    image: '/assets/avatars/default.png'
  },
  {
    id: 'business',
    name: '商务人士',
    image: '/assets/avatars/business.png'
  },
  {
    id: 'casual',
    name: '休闲装扮',
    image: '/assets/avatars/casual.png'
  },
  {
    id: 'sporty',
    name: '运动型',
    image: '/assets/avatars/sporty.png'
  }
];

// 生成数字角色列表 (1-28)
const generateNumberedAvatars = (): Avatar[] => {
  const avatars: Avatar[] = [];
  // 从1到28生成角色
  for (let i = 1; i <= 28; i++) {
    avatars.push({
      id: `avatar${i}`,
      name: `角色 ${i}`,
      image: `/assets/avatars/${i}.png`
    });
  }
  return avatars;
};

// 合并所有角色
const allAvatars = [...baseAvatars, ...generateNumberedAvatars()];

export const useAvatarStore = create<AvatarState>()(
  persist(
    (set) => ({
      selectedAvatar: 'default',
      availableAvatars: allAvatars,
      setSelectedAvatar: (avatarId) => set({ selectedAvatar: avatarId }),
    }),
    {
      name: 'avatar-storage',
    }
  )
); 