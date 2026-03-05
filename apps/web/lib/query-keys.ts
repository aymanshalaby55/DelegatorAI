export const queryKeys = {
  meetings: {
    all: ["meetings"] as const,
    byId: (id: string) => ["meeting", id] as const,
  },
};
