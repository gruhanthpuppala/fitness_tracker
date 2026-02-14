export const colors = {
  bg: {
    primary: "#0D0D0D",
    surface: "#1A1A1A",
    elevated: "#242424",
  },
  border: "#2A2A2A",
  text: {
    primary: "#F5F0EB",
    secondary: "#8A8A8A",
    muted: "#5A5A5A",
  },
  accent: {
    primary: "#C9A96E",
    primaryHover: "#D4B97E",
    secondary: "#8B9D77",
  },
  status: {
    success: "#8B9D77",
    warning: "#D4A843",
    error: "#B85C5C",
    info: "#6B8CA6",
  },
} as const;

export const chartColors = {
  weight: colors.accent.primary,
  calories: colors.status.warning,
  protein: colors.accent.secondary,
  grid: colors.border,
  text: colors.text.secondary,
} as const;
