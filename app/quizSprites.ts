export const SPRITES = {
  soldier: {
    idle: {
      src: require("../assets/sprites/soldier/Soldier-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/soldier/Soldier-Attack01.png"),
      frames: 6,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/soldier/Soldier-Attack02.png"),
      frames: 6,
      fps: 8,
    },
    hurt: {
      src: require("../assets/sprites/soldier/Soldier-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/soldier/Soldier-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
  orc: {
    idle: {
      src: require("../assets/sprites/orc/Orc-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/orc/Orc-Attack01.png"),
      frames: 6,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/orc/Orc-Attack02.png"),
      frames: 6,
      fps: 8,
    },
    hurt: {
      src: require("../assets/sprites/orc/Orc-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/orc/Orc-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
  skeleton: {
    idle: {
      src: require("../assets/sprites/skeleton/Skeleton-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/skeleton/Skeleton-Attack01.png"),
      frames: 6,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/skeleton/Skeleton-Attack02.png"),
      frames: 6,
      fps: 8,
    },
    hurt: {
      src: require("../assets/sprites/skeleton/Skeleton-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/skeleton/Skeleton-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
  elite_orc: {
    idle: {
      src: require("../assets/sprites/elite_orc/Elite Orc-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/elite_orc/Elite Orc-Attack01.png"),
      frames: 11,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/elite_orc/Elite Orc-Attack02.png"),
      frames: 9,
      fps: 8,
    },
    hurt: {
      src: require("../assets/sprites/elite_orc/Elite Orc-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/elite_orc/Elite Orc-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
  armored_orc: {
    idle: {
      src: require("../assets/sprites/armored_orc/Armored Orc-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/armored_orc/Armored Orc-Attack01.png"),
      frames: 7,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/armored_orc/Armored Orc-Attack02.png"),
      frames: 8,
      fps: 8,
    },
    hurt: {
      src: require("../assets/sprites/armored_orc/Armored Orc-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/armored_orc/Armored Orc-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
  armored_skeleton: {
    idle: {
      src: require("../assets/sprites/armored_skeleton/Armored Skeleton-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/armored_skeleton/Armored Skeleton-Attack01.png"),
      frames: 8,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/armored_skeleton/Armored Skeleton-Attack02.png"),
      frames: 9,
      fps: 8,
    },
    hurt: {
      src: require("../assets/sprites/armored_skeleton/Armored Skeleton-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/armored_skeleton/Armored Skeleton-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
  greatsword_skeleton: {
    idle: {
      src: require("../assets/sprites/greatsword_skeleton/Greatsword Skeleton-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/greatsword_skeleton/Greatsword Skeleton-Attack01.png"),
      frames: 9,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/greatsword_skeleton/Greatsword Skeleton-Attack02.png"),
      frames: 12,
      fps: 12,
    },
    hurt: {
      src: require("../assets/sprites/greatsword_skeleton/Greatsword Skeleton-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/greatsword_skeleton/Greatsword Skeleton-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
  orc_rider: {
    idle: {
      src: require("../assets/sprites/orc_rider/Orc rider-Idle.png"),
      frames: 6,
      fps: 6,
    },
    attack1: {
      src: require("../assets/sprites/orc_rider/Orc rider-Attack01.png"),
      frames: 8,
      fps: 8,
    },
    attack2: {
      src: require("../assets/sprites/orc_rider/Orc rider-Attack02.png"),
      frames: 9,
      fps: 8,
    },
    attack3: {
      src: require("../assets/sprites/orc_rider/Orc rider-Attack03.png"),
      frames: 11,
      fps: 8,
    },
    hurt: {
      src: require("../assets/sprites/orc_rider/Orc rider-Hurt.png"),
      frames: 4,
      fps: 8,
    },
    death: {
      src: require("../assets/sprites/orc_rider/Orc rider-Death.png"),
      frames: 4,
      fps: 7,
    },
  },
} as const;

export type SpriteKey = keyof typeof SPRITES;


