"use client";

import { useState } from "react";

export function useFocusState() {
  const [isFocused, setIsFocused] = useState(false);

  return {
    isFocused,
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  };
}
