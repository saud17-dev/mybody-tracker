# Built-in Meal Library

Add a searchable catalog of common meals with pre-filled protein & calorie values. Tap any item to log it instantly with its standard serving size. Doesn't replace personal presets — sits alongside them.

## What gets added

### 1. New file: `src/lib/mealLibrary.ts`
A static catalog of ~120 meals, each with:
- `name` (e.g. "Chicken breast")
- `serving` (e.g. "150g", "1 cup", "1 scoop")
- `proteinG`, `calories`
- `mealType` (Breakfast/Lunch/Dinner/Snack/Shake)
- `category` (for filtering)
- `emoji`

Categories covered:
- **Protein sources** (~25): chicken breast, salmon, tuna, eggs, ground beef, turkey, tofu, cottage cheese, Greek yogurt, etc.
- **Carbs & grains** (~15): white rice, brown rice, oats, sweet potato, pasta, quinoa, bread slice, bagel, etc.
- **Composed meals** (~30): chicken & rice bowl, salmon & veg, tuna sandwich, omelette (3-egg), turkey wrap, pasta bolognese, stir fry, burrito bowl, etc.
- **Breakfast** (~15): scrambled eggs, oatmeal, protein pancakes, yogurt bowl, avocado toast, smoothie bowl, etc.
- **Snacks & shakes** (~20): whey shake, protein bar, almonds, peanut butter, jerky, hummus, banana, apple, etc.
- **Restaurant/branded** (~15): Chipotle chicken bowl, Subway 6" turkey, McDonald's Big Mac, Pret chicken salad, Nando's quarter chicken, etc. (clearly approximate)

### 2. New component: `src/components/MealLibrarySheet.tsx`
A bottom sheet that opens from a new "Browse library" button on the Nutrition page. Contains:
- Search input (filter by name)
- Category filter chips (All, Protein, Carbs, Meals, Breakfast, Snacks, Restaurant)
- Scrollable list of cards showing emoji, name, serving size, protein, calories
- Tap a card → logs it for today with its standard values + closes sheet + toast

### 3. Edit `src/pages/Nutrition.tsx`
Add a secondary button next to "Log a meal" labeled "Browse library" (with a `BookOpen` icon) that opens the new sheet. Reuses the existing `createLog` mutation.

## What does NOT change

- No DB schema changes — library is static in code
- Personal `meal_presets` keep working exactly as before
- Goal editor, weekly chart, history unchanged
- Portions are fixed standard servings (no multiplier UI per your choice)

## Technical notes

- Library is a plain `export const MEAL_LIBRARY: LibraryMeal[]` — no fetching, no caching
- Restaurant items get a small "≈ approximate" label
- Search is case-insensitive substring match on name
- Sheet uses the same `Sheet` + `Card` components already in the page for visual consistency
