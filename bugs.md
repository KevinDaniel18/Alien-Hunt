## 🐛 **Aliens Disappearing**

**The Problem:** The aliens were constantly disappearing and reappearing during animations, especially while walking.

**The Root Cause:** The code was calculating the sprite sheet coordinates assuming a regular, uniform 3-column layout, but the sprite sheet had an irregular layout:
```
[0][1] ← 2 columns
[2][3][4] ← 3 columns
[5][6][7] ← 3 columns
[8][9][10] ← 3 columns
```

**Why it crashed:** When the system attempted to display certain frames, it calculated incorrect coordinates that pointed to empty spaces on the sprite sheet, causing the alien to visually "disappear."

**The solution:** Replace the automatic mathematical calculation with a manual mapping that defines the exact coordinates of each frame based on the actual sprite sheet layout.

**Result:** Smooth animations without disappearances, as each frame is drawn from the correct position in the image.

---
*In short: Incorrect sprite sheet coordinate mapping due to an irregular layout.*