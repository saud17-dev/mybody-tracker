// Static meal library with approximate nutrition per standard serving.
// Values are rounded estimates suitable for daily tracking.

export type LibraryCategory =
  | "Saudi"
  | "Fruits"
  | "Protein"
  | "Carbs"
  | "Meals"
  | "Breakfast"
  | "Snacks"
  | "Restaurant";


export interface LibraryMeal {
  id: string;
  name: string;
  serving: string;
  proteinG: number;
  calories: number;
  mealType: "Breakfast" | "Lunch" | "Dinner" | "Snack" | "Shake";
  category: LibraryCategory;
  emoji: string;
  /** Carbohydrates in grams. Estimated from calories when not set. */
  carbsG?: number;
  /** Fat in grams. Estimated from calories when not set. */
  fatG?: number;
  approximate?: boolean;
}

/**
 * Carbs/fat for a library meal. When a meal only has protein + calories we
 * split the remaining energy 55% carbs / 45% fat — a rough but useful estimate
 * that keeps the macro charts populated. Values are always editable after logging.
 */
export function macrosFor(meal: { proteinG: number; calories: number; carbsG?: number; fatG?: number }) {
  const remaining = Math.max(0, meal.calories - meal.proteinG * 4);
  return {
    carbsG: meal.carbsG ?? Math.round((remaining * 0.55) / 4),
    fatG: meal.fatG ?? Math.round((remaining * 0.45) / 9),
  };
}

export const MEAL_LIBRARY: LibraryMeal[] = [
  // ── Saudi & Gulf dishes (approximate home/restaurant portions)
  { id: "sa-kabsachicken", name: "Chicken kabsa (كبسة دجاج)", serving: "1 plate (~450g)", proteinG: 42, calories: 750, mealType: "Lunch", category: "Saudi", emoji: "🍛", approximate: true },
  { id: "sa-kabsalamb", name: "Lamb kabsa (كبسة لحم)", serving: "1 plate (~450g)", proteinG: 40, calories: 880, mealType: "Lunch", category: "Saudi", emoji: "🍛", approximate: true },
  { id: "sa-mandichicken", name: "Chicken mandi (مندي دجاج)", serving: "1/4 chicken + rice", proteinG: 45, calories: 780, mealType: "Lunch", category: "Saudi", emoji: "🍗", approximate: true },
  { id: "sa-mandilamb", name: "Lamb mandi (مندي لحم)", serving: "1 plate", proteinG: 43, calories: 900, mealType: "Lunch", category: "Saudi", emoji: "🍖", approximate: true },
  { id: "sa-madhbi", name: "Madhbi grilled chicken (مظبي)", serving: "1/2 chicken + rice", proteinG: 55, calories: 820, mealType: "Dinner", category: "Saudi", emoji: "🔥", approximate: true },
  { id: "sa-saleeg", name: "Saleeg (سليق)", serving: "1 plate with chicken", proteinG: 38, calories: 700, mealType: "Lunch", category: "Saudi", emoji: "🍚", approximate: true },
  { id: "sa-jareesh", name: "Jareesh (جريش)", serving: "1 bowl (300g)", proteinG: 16, calories: 380, mealType: "Lunch", category: "Saudi", emoji: "🥣", approximate: true },
  { id: "sa-harees", name: "Harees (هريس)", serving: "1 bowl (300g)", proteinG: 22, calories: 420, mealType: "Dinner", category: "Saudi", emoji: "🥣", approximate: true },
  { id: "sa-marqa", name: "Lamb maraq with rice (مرقة)", serving: "1 plate", proteinG: 35, calories: 680, mealType: "Lunch", category: "Saudi", emoji: "🍲", approximate: true },
  { id: "sa-margoog", name: "Margoog (مرقوق)", serving: "1 bowl", proteinG: 24, calories: 480, mealType: "Lunch", category: "Saudi", emoji: "🍲", approximate: true },
  { id: "sa-matazeez", name: "Matazeez (مطازيز)", serving: "1 bowl", proteinG: 22, calories: 470, mealType: "Lunch", category: "Saudi", emoji: "🍲", approximate: true },
  { id: "sa-mutabbaq", name: "Mutabbaq (مطبق لحم)", serving: "1 piece", proteinG: 14, calories: 350, mealType: "Snack", category: "Saudi", emoji: "🫓", approximate: true },
  { id: "sa-shawarmachicken", name: "Chicken shawarma wrap (شاورما دجاج)", serving: "1 regular wrap", proteinG: 28, calories: 480, mealType: "Lunch", category: "Saudi", emoji: "🌯", approximate: true },
  { id: "sa-shawarmameat", name: "Meat shawarma wrap (شاورما لحم)", serving: "1 regular wrap", proteinG: 26, calories: 540, mealType: "Lunch", category: "Saudi", emoji: "🌯", approximate: true },
  { id: "sa-shishtawook", name: "Shish tawook skewers (شيش طاووق)", serving: "2 skewers", proteinG: 40, calories: 340, mealType: "Dinner", category: "Saudi", emoji: "🍢", approximate: true },
  { id: "sa-kofta", name: "Kofta kebab (كفتة)", serving: "2 skewers", proteinG: 34, calories: 430, mealType: "Dinner", category: "Saudi", emoji: "🍢", approximate: true },
  { id: "sa-mixedgrill", name: "Mixed grill platter (مشاوي مشكل)", serving: "1 platter", proteinG: 60, calories: 850, mealType: "Dinner", category: "Saudi", emoji: "🍖", approximate: true },
  { id: "sa-samakmashwi", name: "Grilled hammour (سمك مشوي)", serving: "200g fillet", proteinG: 44, calories: 300, mealType: "Dinner", category: "Saudi", emoji: "🐟", approximate: true },
  { id: "sa-sayadieh", name: "Sayadieh fish & rice (صيادية)", serving: "1 plate", proteinG: 38, calories: 640, mealType: "Dinner", category: "Saudi", emoji: "🐟", approximate: true },
  { id: "sa-foul", name: "Foul medames (فول)", serving: "1 bowl (250g)", proteinG: 14, calories: 300, mealType: "Breakfast", category: "Saudi", emoji: "🫘", approximate: true },
  { id: "sa-tamees", name: "Tamees bread (تميس)", serving: "1 loaf", proteinG: 10, calories: 340, mealType: "Breakfast", category: "Saudi", emoji: "🫓", approximate: true },
  { id: "sa-shakshuka", name: "Shakshuka (شكشوكة)", serving: "2 eggs pan", proteinG: 16, calories: 280, mealType: "Breakfast", category: "Saudi", emoji: "🍳", approximate: true },
  { id: "sa-masoub", name: "Masoub (معصوب)", serving: "1 bowl", proteinG: 8, calories: 520, mealType: "Breakfast", category: "Saudi", emoji: "🍌", approximate: true },
  { id: "sa-areeka", name: "Areeka (عريكة)", serving: "1 bowl", proteinG: 6, calories: 480, mealType: "Breakfast", category: "Saudi", emoji: "🍯", approximate: true },
  { id: "sa-hummus", name: "Hummus (حمص)", serving: "1 small plate (100g)", proteinG: 8, calories: 250, mealType: "Snack", category: "Saudi", emoji: "🥣", approximate: true },
  { id: "sa-mutabbal", name: "Mutabbal (متبل)", serving: "1 small plate (100g)", proteinG: 4, calories: 180, mealType: "Snack", category: "Saudi", emoji: "🍆", approximate: true },
  { id: "sa-tabbouleh", name: "Tabbouleh (تبولة)", serving: "1 bowl", proteinG: 3, calories: 150, mealType: "Snack", category: "Saudi", emoji: "🥗", approximate: true },
  { id: "sa-fattoush", name: "Fattoush (فتوش)", serving: "1 bowl", proteinG: 4, calories: 200, mealType: "Snack", category: "Saudi", emoji: "🥗", approximate: true },
  { id: "sa-falafel", name: "Falafel (فلافل)", serving: "5 pieces", proteinG: 12, calories: 330, mealType: "Snack", category: "Saudi", emoji: "🧆", approximate: true },
  { id: "sa-sambousa", name: "Sambousa (سمبوسة)", serving: "3 pieces", proteinG: 9, calories: 290, mealType: "Snack", category: "Saudi", emoji: "🥟", approximate: true },
  { id: "sa-dates", name: "Dates (تمر)", serving: "3 pieces", proteinG: 1, calories: 200, mealType: "Snack", category: "Saudi", emoji: "🌴" },
  { id: "sa-laban", name: "Laban (لبن)", serving: "250ml", proteinG: 8, calories: 110, mealType: "Snack", category: "Saudi", emoji: "🥛" },
  { id: "sa-karak", name: "Karak tea (كرك)", serving: "1 cup", proteinG: 3, calories: 130, mealType: "Snack", category: "Saudi", emoji: "🍵", approximate: true },
  { id: "sa-qahwa", name: "Arabic coffee (قهوة عربية)", serving: "1 cup", proteinG: 0, calories: 5, mealType: "Snack", category: "Saudi", emoji: "☕" },
  { id: "sa-kunafa", name: "Kunafa (كنافة)", serving: "1 slice", proteinG: 7, calories: 430, mealType: "Snack", category: "Saudi", emoji: "🍮", approximate: true },
  { id: "sa-luqaimat", name: "Luqaimat (لقيمات)", serving: "6 pieces", proteinG: 4, calories: 350, mealType: "Snack", category: "Saudi", emoji: "🍩", approximate: true },
  { id: "sa-albaik4", name: "Al Baik broast (4 pcs)", serving: "4 pieces + bun", proteinG: 42, calories: 780, mealType: "Lunch", category: "Saudi", emoji: "🍗", approximate: true },
  { id: "sa-albaikfillet", name: "Al Baik chicken fillet meal", serving: "1 meal", proteinG: 38, calories: 700, mealType: "Lunch", category: "Saudi", emoji: "🍗", approximate: true },
  { id: "sa-kudu", name: "Kudu chicken sandwich", serving: "1 sandwich", proteinG: 25, calories: 450, mealType: "Lunch", category: "Saudi", emoji: "🥪", approximate: true },
  { id: "sa-herfy", name: "Herfy Super burger", serving: "1 burger", proteinG: 28, calories: 640, mealType: "Lunch", category: "Saudi", emoji: "🍔", approximate: true },
  { id: "sa-maraidhijaj", name: "Grilled chicken breast + salad (مشوي)", serving: "200g + salad", proteinG: 55, calories: 380, mealType: "Dinner", category: "Saudi", emoji: "🍗" },

  // ── Protein sources
  { id: "p-chickenbreast", name: "Chicken breast (cooked)", serving: "150g", proteinG: 46, calories: 240, mealType: "Lunch", category: "Protein", emoji: "🍗" },
  { id: "p-chickenthigh", name: "Chicken thigh (skinless)", serving: "150g", proteinG: 36, calories: 310, mealType: "Lunch", category: "Protein", emoji: "🍗" },
  { id: "p-salmon", name: "Salmon fillet", serving: "150g", proteinG: 34, calories: 310, mealType: "Dinner", category: "Protein", emoji: "🐟" },
  { id: "p-tunacan", name: "Tuna (canned in water)", serving: "1 can (140g)", proteinG: 30, calories: 130, mealType: "Lunch", category: "Protein", emoji: "🐟" },
  { id: "p-codfillet", name: "Cod fillet", serving: "150g", proteinG: 28, calories: 130, mealType: "Dinner", category: "Protein", emoji: "🐟" },
  { id: "p-shrimp", name: "Shrimp (cooked)", serving: "150g", proteinG: 36, calories: 150, mealType: "Dinner", category: "Protein", emoji: "🦐" },
  { id: "p-eggswhole", name: "Whole eggs", serving: "3 large", proteinG: 19, calories: 215, mealType: "Breakfast", category: "Protein", emoji: "🥚" },
  { id: "p-eggwhites", name: "Egg whites", serving: "5 whites", proteinG: 18, calories: 80, mealType: "Breakfast", category: "Protein", emoji: "🥚" },
  { id: "p-groundbeef85", name: "Ground beef 85/15", serving: "150g cooked", proteinG: 39, calories: 320, mealType: "Dinner", category: "Protein", emoji: "🥩" },
  { id: "p-steak", name: "Sirloin steak", serving: "200g", proteinG: 52, calories: 410, mealType: "Dinner", category: "Protein", emoji: "🥩" },
  { id: "p-porkloin", name: "Pork loin", serving: "150g", proteinG: 39, calories: 260, mealType: "Dinner", category: "Protein", emoji: "🥓" },
  { id: "p-bacon", name: "Bacon", serving: "3 slices", proteinG: 9, calories: 130, mealType: "Breakfast", category: "Protein", emoji: "🥓" },
  { id: "p-turkeybreast", name: "Turkey breast (deli)", serving: "100g", proteinG: 22, calories: 110, mealType: "Lunch", category: "Protein", emoji: "🦃" },
  { id: "p-groundturkey", name: "Ground turkey 93/7", serving: "150g cooked", proteinG: 36, calories: 250, mealType: "Dinner", category: "Protein", emoji: "🦃" },
  { id: "p-tofufirm", name: "Firm tofu", serving: "150g", proteinG: 24, calories: 220, mealType: "Dinner", category: "Protein", emoji: "🌱" },
  { id: "p-tempeh", name: "Tempeh", serving: "100g", proteinG: 19, calories: 190, mealType: "Dinner", category: "Protein", emoji: "🌱" },
  { id: "p-edamame", name: "Edamame (shelled)", serving: "1 cup", proteinG: 18, calories: 190, mealType: "Snack", category: "Protein", emoji: "🫛" },
  { id: "p-cottage", name: "Cottage cheese (low fat)", serving: "1 cup (225g)", proteinG: 28, calories: 180, mealType: "Snack", category: "Protein", emoji: "🥛" },
  { id: "p-greekyog", name: "Greek yogurt (non-fat)", serving: "170g cup", proteinG: 17, calories: 100, mealType: "Snack", category: "Protein", emoji: "🥄" },
  { id: "p-skyr", name: "Skyr", serving: "170g cup", proteinG: 18, calories: 110, mealType: "Snack", category: "Protein", emoji: "🥄" },
  { id: "p-mozzarella", name: "Mozzarella", serving: "30g", proteinG: 7, calories: 85, mealType: "Snack", category: "Protein", emoji: "🧀" },
  { id: "p-cheddar", name: "Cheddar cheese", serving: "30g", proteinG: 7, calories: 115, mealType: "Snack", category: "Protein", emoji: "🧀" },
  { id: "p-lentils", name: "Lentils (cooked)", serving: "1 cup", proteinG: 18, calories: 230, mealType: "Lunch", category: "Protein", emoji: "🫘" },
  { id: "p-blackbeans", name: "Black beans (cooked)", serving: "1 cup", proteinG: 15, calories: 220, mealType: "Lunch", category: "Protein", emoji: "🫘" },
  { id: "p-chickpeas", name: "Chickpeas (cooked)", serving: "1 cup", proteinG: 15, calories: 270, mealType: "Lunch", category: "Protein", emoji: "🫛" },

  // ── Carbs & grains
  { id: "c-whiterice", name: "White rice (cooked)", serving: "1 cup", proteinG: 4, calories: 205, mealType: "Lunch", category: "Carbs", emoji: "🍚" },
  { id: "c-brownrice", name: "Brown rice (cooked)", serving: "1 cup", proteinG: 5, calories: 215, mealType: "Lunch", category: "Carbs", emoji: "🍚" },
  { id: "c-jasmine", name: "Jasmine rice (cooked)", serving: "1 cup", proteinG: 4, calories: 240, mealType: "Lunch", category: "Carbs", emoji: "🍚" },
  { id: "c-oats", name: "Rolled oats (dry)", serving: "50g", proteinG: 7, calories: 190, mealType: "Breakfast", category: "Carbs", emoji: "🥣" },
  { id: "c-sweetpot", name: "Sweet potato (baked)", serving: "1 medium", proteinG: 2, calories: 105, mealType: "Dinner", category: "Carbs", emoji: "🍠" },
  { id: "c-potato", name: "Baked potato", serving: "1 medium", proteinG: 4, calories: 160, mealType: "Dinner", category: "Carbs", emoji: "🥔" },
  { id: "c-pasta", name: "Pasta (cooked)", serving: "1 cup", proteinG: 8, calories: 220, mealType: "Dinner", category: "Carbs", emoji: "🍝" },
  { id: "c-quinoa", name: "Quinoa (cooked)", serving: "1 cup", proteinG: 8, calories: 220, mealType: "Lunch", category: "Carbs", emoji: "🌾" },
  { id: "c-couscous", name: "Couscous (cooked)", serving: "1 cup", proteinG: 6, calories: 175, mealType: "Lunch", category: "Carbs", emoji: "🌾" },
  { id: "c-breadwhite", name: "White bread", serving: "1 slice", proteinG: 3, calories: 80, mealType: "Snack", category: "Carbs", emoji: "🍞" },
  { id: "c-breadwhole", name: "Whole-wheat bread", serving: "1 slice", proteinG: 4, calories: 90, mealType: "Snack", category: "Carbs", emoji: "🍞" },
  { id: "c-bagel", name: "Plain bagel", serving: "1 medium", proteinG: 11, calories: 280, mealType: "Breakfast", category: "Carbs", emoji: "🥯" },
  { id: "c-tortilla", name: "Flour tortilla", serving: "1 large (10\")", proteinG: 6, calories: 210, mealType: "Lunch", category: "Carbs", emoji: "🫓" },
  { id: "c-pita", name: "Pita bread", serving: "1 medium", proteinG: 6, calories: 165, mealType: "Lunch", category: "Carbs", emoji: "🫓" },
  { id: "c-cornflakes", name: "Cornflakes", serving: "1 cup", proteinG: 2, calories: 100, mealType: "Breakfast", category: "Carbs", emoji: "🥣" },

  // ── Composed meals
  { id: "m-chickenrice", name: "Chicken & rice bowl", serving: "150g chicken + 1 cup rice", proteinG: 50, calories: 480, mealType: "Lunch", category: "Meals", emoji: "🍱" },
  { id: "m-salmonveg", name: "Salmon, rice & veg", serving: "Standard plate", proteinG: 38, calories: 560, mealType: "Dinner", category: "Meals", emoji: "🍣" },
  { id: "m-tunasandwich", name: "Tuna sandwich", serving: "2 slices + 1 can tuna", proteinG: 35, calories: 380, mealType: "Lunch", category: "Meals", emoji: "🥪" },
  { id: "m-chickensalad", name: "Chicken caesar salad", serving: "Large bowl", proteinG: 38, calories: 450, mealType: "Lunch", category: "Meals", emoji: "🥗" },
  { id: "m-omelette3", name: "3-egg cheese omelette", serving: "Standard", proteinG: 25, calories: 360, mealType: "Breakfast", category: "Meals", emoji: "🍳" },
  { id: "m-turkeywrap", name: "Turkey & cheese wrap", serving: "1 large wrap", proteinG: 32, calories: 450, mealType: "Lunch", category: "Meals", emoji: "🌯" },
  { id: "m-bolognese", name: "Spaghetti bolognese", serving: "Standard plate", proteinG: 32, calories: 580, mealType: "Dinner", category: "Meals", emoji: "🍝" },
  { id: "m-stirfry", name: "Beef & veg stir-fry + rice", serving: "Standard plate", proteinG: 38, calories: 550, mealType: "Dinner", category: "Meals", emoji: "🥘" },
  { id: "m-burritobowl", name: "Burrito bowl (chicken)", serving: "Standard", proteinG: 42, calories: 620, mealType: "Lunch", category: "Meals", emoji: "🌯" },
  { id: "m-poke", name: "Poke bowl (salmon)", serving: "Regular", proteinG: 30, calories: 540, mealType: "Lunch", category: "Meals", emoji: "🍣" },
  { id: "m-sushi", name: "Sushi (8 pieces)", serving: "8 nigiri/maki", proteinG: 18, calories: 380, mealType: "Lunch", category: "Meals", emoji: "🍣" },
  { id: "m-pizzaslice", name: "Pizza", serving: "2 slices", proteinG: 24, calories: 580, mealType: "Dinner", category: "Meals", emoji: "🍕" },
  { id: "m-burger", name: "Cheeseburger (homemade)", serving: "1 burger + bun", proteinG: 30, calories: 520, mealType: "Dinner", category: "Meals", emoji: "🍔" },
  { id: "m-curry", name: "Chicken curry + rice", serving: "Standard", proteinG: 38, calories: 620, mealType: "Dinner", category: "Meals", emoji: "🍛" },
  { id: "m-thaigreen", name: "Thai green curry + rice", serving: "Standard", proteinG: 30, calories: 580, mealType: "Dinner", category: "Meals", emoji: "🍛" },
  { id: "m-chili", name: "Beef chili", serving: "1.5 cups", proteinG: 32, calories: 380, mealType: "Dinner", category: "Meals", emoji: "🌶️" },
  { id: "m-shepherds", name: "Shepherd's pie", serving: "Standard portion", proteinG: 28, calories: 480, mealType: "Dinner", category: "Meals", emoji: "🥧" },
  { id: "m-roastdinner", name: "Roast chicken dinner", serving: "Standard plate", proteinG: 45, calories: 650, mealType: "Dinner", category: "Meals", emoji: "🍗" },
  { id: "m-fishchips", name: "Fish & chips", serving: "Standard portion", proteinG: 32, calories: 850, mealType: "Dinner", category: "Meals", emoji: "🍟" },
  { id: "m-meatballs", name: "Meatballs & pasta", serving: "Standard plate", proteinG: 38, calories: 620, mealType: "Dinner", category: "Meals", emoji: "🍝" },
  { id: "m-fajitas", name: "Chicken fajitas (2)", serving: "2 wraps", proteinG: 40, calories: 580, mealType: "Dinner", category: "Meals", emoji: "🌮" },
  { id: "m-tacos", name: "Beef tacos (3)", serving: "3 tacos", proteinG: 28, calories: 520, mealType: "Dinner", category: "Meals", emoji: "🌮" },
  { id: "m-lasagna", name: "Lasagna", serving: "1 portion", proteinG: 30, calories: 520, mealType: "Dinner", category: "Meals", emoji: "🍝" },
  { id: "m-eggsbacon", name: "Eggs, bacon & toast", serving: "Full plate", proteinG: 32, calories: 540, mealType: "Breakfast", category: "Meals", emoji: "🍳" },
  { id: "m-chickenwrap", name: "Grilled chicken wrap", serving: "1 wrap", proteinG: 35, calories: 480, mealType: "Lunch", category: "Meals", emoji: "🌯" },
  { id: "m-greeksalad", name: "Greek salad + chicken", serving: "Large bowl", proteinG: 35, calories: 420, mealType: "Lunch", category: "Meals", emoji: "🥗" },
  { id: "m-paddle", name: "Tofu pad thai", serving: "Standard", proteinG: 22, calories: 580, mealType: "Dinner", category: "Meals", emoji: "🍜" },
  { id: "m-ramen", name: "Pork ramen", serving: "1 bowl", proteinG: 28, calories: 580, mealType: "Dinner", category: "Meals", emoji: "🍜" },
  { id: "m-prawncurry", name: "Prawn coconut curry + rice", serving: "Standard", proteinG: 28, calories: 560, mealType: "Dinner", category: "Meals", emoji: "🍛" },
  { id: "m-veggiestir", name: "Veggie stir-fry + tofu", serving: "Standard plate", proteinG: 22, calories: 420, mealType: "Dinner", category: "Meals", emoji: "🥘" },

  // ── Breakfast
  { id: "b-scrambled", name: "Scrambled eggs (3)", serving: "3 eggs + butter", proteinG: 21, calories: 270, mealType: "Breakfast", category: "Breakfast", emoji: "🍳" },
  { id: "b-oatmeal", name: "Oatmeal with milk", serving: "50g oats + 200ml milk", proteinG: 14, calories: 320, mealType: "Breakfast", category: "Breakfast", emoji: "🥣" },
  { id: "b-protpancakes", name: "Protein pancakes", serving: "3 small", proteinG: 28, calories: 380, mealType: "Breakfast", category: "Breakfast", emoji: "🥞" },
  { id: "b-pancakes", name: "Pancakes + syrup", serving: "3 standard", proteinG: 10, calories: 480, mealType: "Breakfast", category: "Breakfast", emoji: "🥞" },
  { id: "b-yogurtbowl", name: "Greek yogurt + granola + berries", serving: "1 bowl", proteinG: 22, calories: 340, mealType: "Breakfast", category: "Breakfast", emoji: "🥣" },
  { id: "b-avotoast", name: "Avocado toast + egg", serving: "1 slice + 1 egg", proteinG: 12, calories: 320, mealType: "Breakfast", category: "Breakfast", emoji: "🥑" },
  { id: "b-smoothiebowl", name: "Smoothie bowl", serving: "1 bowl", proteinG: 18, calories: 380, mealType: "Breakfast", category: "Breakfast", emoji: "🍓" },
  { id: "b-frenchtoast", name: "French toast (2)", serving: "2 slices", proteinG: 14, calories: 380, mealType: "Breakfast", category: "Breakfast", emoji: "🍞" },
  { id: "b-breakfastburrito", name: "Breakfast burrito", serving: "1 large", proteinG: 28, calories: 540, mealType: "Breakfast", category: "Breakfast", emoji: "🌯" },
  { id: "b-musli", name: "Muesli + milk", serving: "60g + 200ml", proteinG: 12, calories: 340, mealType: "Breakfast", category: "Breakfast", emoji: "🥣" },
  { id: "b-eggmuffins", name: "Egg muffins (3)", serving: "3 muffins", proteinG: 21, calories: 240, mealType: "Breakfast", category: "Breakfast", emoji: "🧁" },
  { id: "b-overnightoats", name: "Overnight oats + protein", serving: "1 jar", proteinG: 28, calories: 420, mealType: "Breakfast", category: "Breakfast", emoji: "🫙" },
  { id: "b-bagelcream", name: "Bagel + cream cheese", serving: "1 + 30g", proteinG: 14, calories: 380, mealType: "Breakfast", category: "Breakfast", emoji: "🥯" },
  { id: "b-bagelsalmon", name: "Bagel + smoked salmon", serving: "Standard", proteinG: 24, calories: 420, mealType: "Breakfast", category: "Breakfast", emoji: "🥯" },
  { id: "b-shakshuka", name: "Shakshuka", serving: "1 portion", proteinG: 20, calories: 320, mealType: "Breakfast", category: "Breakfast", emoji: "🍳" },

  // ── Snacks & shakes
  { id: "s-wheyshake", name: "Whey protein shake", serving: "1 scoop + water", proteinG: 24, calories: 120, mealType: "Shake", category: "Snacks", emoji: "🥤" },
  { id: "s-wheymilk", name: "Whey shake with milk", serving: "1 scoop + 250ml milk", proteinG: 32, calories: 270, mealType: "Shake", category: "Snacks", emoji: "🥤" },
  { id: "s-caseinshake", name: "Casein shake", serving: "1 scoop + water", proteinG: 24, calories: 120, mealType: "Shake", category: "Snacks", emoji: "🥤" },
  { id: "s-massgainer", name: "Mass gainer shake", serving: "1 serving", proteinG: 50, calories: 1250, mealType: "Shake", category: "Snacks", emoji: "🥤" },
  { id: "s-protbar", name: "Protein bar", serving: "1 bar (60g)", proteinG: 20, calories: 220, mealType: "Snack", category: "Snacks", emoji: "🍫" },
  { id: "s-almonds", name: "Almonds", serving: "30g (~24)", proteinG: 6, calories: 175, mealType: "Snack", category: "Snacks", emoji: "🌰" },
  { id: "s-cashews", name: "Cashews", serving: "30g", proteinG: 5, calories: 165, mealType: "Snack", category: "Snacks", emoji: "🌰" },
  { id: "s-peanuts", name: "Peanuts", serving: "30g", proteinG: 8, calories: 170, mealType: "Snack", category: "Snacks", emoji: "🥜" },
  { id: "s-pb", name: "Peanut butter", serving: "2 tbsp", proteinG: 8, calories: 190, mealType: "Snack", category: "Snacks", emoji: "🥜" },
  { id: "s-jerky", name: "Beef jerky", serving: "30g", proteinG: 11, calories: 90, mealType: "Snack", category: "Snacks", emoji: "🥩" },
  { id: "s-hummus", name: "Hummus + carrots", serving: "60g + veg", proteinG: 5, calories: 180, mealType: "Snack", category: "Snacks", emoji: "🥕" },
  { id: "s-banana", name: "Banana", serving: "1 medium", proteinG: 1, calories: 105, mealType: "Snack", category: "Snacks", emoji: "🍌" },
  { id: "s-apple", name: "Apple", serving: "1 medium", proteinG: 0, calories: 95, mealType: "Snack", category: "Snacks", emoji: "🍎" },
  { id: "s-orange", name: "Orange", serving: "1 medium", proteinG: 1, calories: 65, mealType: "Snack", category: "Snacks", emoji: "🍊" },
  { id: "s-berries", name: "Mixed berries", serving: "1 cup", proteinG: 1, calories: 70, mealType: "Snack", category: "Snacks", emoji: "🫐" },
  { id: "s-darkchoc", name: "Dark chocolate", serving: "30g", proteinG: 2, calories: 170, mealType: "Snack", category: "Snacks", emoji: "🍫" },
  { id: "s-ricecakes", name: "Rice cakes + PB", serving: "2 + 1 tbsp PB", proteinG: 5, calories: 170, mealType: "Snack", category: "Snacks", emoji: "🍘" },
  { id: "s-trailmix", name: "Trail mix", serving: "30g", proteinG: 5, calories: 150, mealType: "Snack", category: "Snacks", emoji: "🌰" },
  { id: "s-popcorn", name: "Popcorn (air-popped)", serving: "3 cups", proteinG: 3, calories: 95, mealType: "Snack", category: "Snacks", emoji: "🍿" },
  { id: "s-skim", name: "Skim milk", serving: "250ml", proteinG: 8, calories: 90, mealType: "Snack", category: "Snacks", emoji: "🥛" },

  // ── Restaurant / branded (approximate)
  { id: "r-chipchicken", name: "Chipotle chicken bowl", serving: "Standard", proteinG: 45, calories: 660, mealType: "Lunch", category: "Restaurant", emoji: "🌯", approximate: true },
  { id: "r-chipsteak", name: "Chipotle steak burrito", serving: "Standard", proteinG: 42, calories: 1050, mealType: "Lunch", category: "Restaurant", emoji: "🌯", approximate: true },
  { id: "r-subturkey", name: "Subway 6\" turkey", serving: "6 inch", proteinG: 18, calories: 280, mealType: "Lunch", category: "Restaurant", emoji: "🥪", approximate: true },
  { id: "r-subitalian", name: "Subway 6\" Italian BMT", serving: "6 inch", proteinG: 19, calories: 410, mealType: "Lunch", category: "Restaurant", emoji: "🥪", approximate: true },
  { id: "r-bigmac", name: "McDonald's Big Mac", serving: "1 burger", proteinG: 25, calories: 550, mealType: "Lunch", category: "Restaurant", emoji: "🍔", approximate: true },
  { id: "r-mcnuggets", name: "McDonald's 10 nuggets", serving: "10 pcs", proteinG: 23, calories: 420, mealType: "Lunch", category: "Restaurant", emoji: "🍗", approximate: true },
  { id: "r-mcfries", name: "McDonald's medium fries", serving: "Medium", proteinG: 4, calories: 320, mealType: "Snack", category: "Restaurant", emoji: "🍟", approximate: true },
  { id: "r-pretchicken", name: "Pret chicken & avo salad", serving: "1 box", proteinG: 32, calories: 420, mealType: "Lunch", category: "Restaurant", emoji: "🥗", approximate: true },
  { id: "r-nandos14", name: "Nando's 1/4 chicken", serving: "1/4 chicken", proteinG: 38, calories: 280, mealType: "Dinner", category: "Restaurant", emoji: "🍗", approximate: true },
  { id: "r-nandoshalf", name: "Nando's 1/2 chicken", serving: "1/2 chicken", proteinG: 76, calories: 560, mealType: "Dinner", category: "Restaurant", emoji: "🍗", approximate: true },
  { id: "r-starbucksprot", name: "Starbucks protein box", serving: "1 box", proteinG: 23, calories: 470, mealType: "Snack", category: "Restaurant", emoji: "📦", approximate: true },
  { id: "r-kfcoriginal", name: "KFC chicken (2 pcs)", serving: "2 pieces", proteinG: 38, calories: 540, mealType: "Dinner", category: "Restaurant", emoji: "🍗", approximate: true },
  { id: "r-dominoslice", name: "Domino's pizza slice", serving: "2 slices large", proteinG: 22, calories: 540, mealType: "Dinner", category: "Restaurant", emoji: "🍕", approximate: true },
  { id: "r-fivguys", name: "Five Guys cheeseburger", serving: "1 burger", proteinG: 30, calories: 840, mealType: "Dinner", category: "Restaurant", emoji: "🍔", approximate: true },
  { id: "r-wagamama", name: "Wagamama chicken katsu curry", serving: "Standard", proteinG: 42, calories: 1050, mealType: "Dinner", category: "Restaurant", emoji: "🍛", approximate: true },

  // ── Fruits — standardized to 100 g raw, edible portion (USDA FoodData Central)
  { id: "fr-apple", name: "Apple", serving: "100 g raw", proteinG: 0.3, carbsG: 13.8, fatG: 0.2, calories: 52, mealType: "Snack", category: "Fruits", emoji: "🍎" },
  { id: "fr-banana", name: "Banana", serving: "100 g raw", proteinG: 1.1, carbsG: 22.8, fatG: 0.3, calories: 89, mealType: "Snack", category: "Fruits", emoji: "🍌" },
  { id: "fr-orange", name: "Orange", serving: "100 g raw", proteinG: 0.9, carbsG: 11.8, fatG: 0.1, calories: 47, mealType: "Snack", category: "Fruits", emoji: "🍊" },
  { id: "fr-mandarin", name: "Mandarin / clementine", serving: "100 g raw", proteinG: 0.8, carbsG: 13.3, fatG: 0.3, calories: 53, mealType: "Snack", category: "Fruits", emoji: "🍊" },
  { id: "fr-grapefruit", name: "Grapefruit", serving: "100 g raw", proteinG: 0.8, carbsG: 10.7, fatG: 0.1, calories: 42, mealType: "Snack", category: "Fruits", emoji: "🍊" },
  { id: "fr-lemon", name: "Lemon", serving: "100 g raw", proteinG: 1.1, carbsG: 9.3, fatG: 0.3, calories: 29, mealType: "Snack", category: "Fruits", emoji: "🍋" },
  { id: "fr-lime", name: "Lime", serving: "100 g raw", proteinG: 0.7, carbsG: 10.5, fatG: 0.2, calories: 30, mealType: "Snack", category: "Fruits", emoji: "🍋" },
  { id: "fr-grapes", name: "Grapes", serving: "100 g raw", proteinG: 0.7, carbsG: 18.1, fatG: 0.2, calories: 69, mealType: "Snack", category: "Fruits", emoji: "🍇" },
  { id: "fr-strawberry", name: "Strawberries", serving: "100 g raw", proteinG: 0.7, carbsG: 7.7, fatG: 0.3, calories: 32, mealType: "Snack", category: "Fruits", emoji: "🍓" },
  { id: "fr-blueberry", name: "Blueberries", serving: "100 g raw", proteinG: 0.7, carbsG: 14.5, fatG: 0.3, calories: 57, mealType: "Snack", category: "Fruits", emoji: "🫐" },
  { id: "fr-raspberry", name: "Raspberries", serving: "100 g raw", proteinG: 1.2, carbsG: 11.9, fatG: 0.7, calories: 52, mealType: "Snack", category: "Fruits", emoji: "🍇" },
  { id: "fr-blackberry", name: "Blackberries", serving: "100 g raw", proteinG: 1.4, carbsG: 9.6, fatG: 0.5, calories: 43, mealType: "Snack", category: "Fruits", emoji: "🍇" },
  { id: "fr-cranberry", name: "Cranberries", serving: "100 g raw", proteinG: 0.4, carbsG: 12.2, fatG: 0.1, calories: 46, mealType: "Snack", category: "Fruits", emoji: "🍒" },
  { id: "fr-cherry", name: "Cherries (sweet)", serving: "100 g raw", proteinG: 1.1, carbsG: 16.0, fatG: 0.2, calories: 63, mealType: "Snack", category: "Fruits", emoji: "🍒" },
  { id: "fr-watermelon", name: "Watermelon", serving: "100 g raw", proteinG: 0.6, carbsG: 7.6, fatG: 0.2, calories: 30, mealType: "Snack", category: "Fruits", emoji: "🍉" },
  { id: "fr-cantaloupe", name: "Cantaloupe melon", serving: "100 g raw", proteinG: 0.8, carbsG: 8.2, fatG: 0.2, calories: 34, mealType: "Snack", category: "Fruits", emoji: "🍈" },
  { id: "fr-honeydew", name: "Honeydew melon", serving: "100 g raw", proteinG: 0.5, carbsG: 9.1, fatG: 0.1, calories: 36, mealType: "Snack", category: "Fruits", emoji: "🍈" },
  { id: "fr-mango", name: "Mango", serving: "100 g raw", proteinG: 0.8, carbsG: 15.0, fatG: 0.4, calories: 60, mealType: "Snack", category: "Fruits", emoji: "🥭" },
  { id: "fr-pineapple", name: "Pineapple", serving: "100 g raw", proteinG: 0.5, carbsG: 13.1, fatG: 0.1, calories: 50, mealType: "Snack", category: "Fruits", emoji: "🍍" },
  { id: "fr-papaya", name: "Papaya", serving: "100 g raw", proteinG: 0.5, carbsG: 10.8, fatG: 0.3, calories: 43, mealType: "Snack", category: "Fruits", emoji: "🍈" },
  { id: "fr-guava", name: "Guava", serving: "100 g raw", proteinG: 2.6, carbsG: 14.3, fatG: 1.0, calories: 68, mealType: "Snack", category: "Fruits", emoji: "🍐" },
  { id: "fr-kiwi", name: "Kiwi", serving: "100 g raw", proteinG: 1.1, carbsG: 14.7, fatG: 0.5, calories: 61, mealType: "Snack", category: "Fruits", emoji: "🥝" },
  { id: "fr-pear", name: "Pear", serving: "100 g raw", proteinG: 0.4, carbsG: 15.2, fatG: 0.1, calories: 57, mealType: "Snack", category: "Fruits", emoji: "🍐" },
  { id: "fr-peach", name: "Peach", serving: "100 g raw", proteinG: 0.9, carbsG: 9.5, fatG: 0.3, calories: 39, mealType: "Snack", category: "Fruits", emoji: "🍑" },
  { id: "fr-nectarine", name: "Nectarine", serving: "100 g raw", proteinG: 1.1, carbsG: 10.6, fatG: 0.3, calories: 44, mealType: "Snack", category: "Fruits", emoji: "🍑" },
  { id: "fr-plum", name: "Plum", serving: "100 g raw", proteinG: 0.7, carbsG: 11.4, fatG: 0.3, calories: 46, mealType: "Snack", category: "Fruits", emoji: "🍑" },
  { id: "fr-apricot", name: "Apricot", serving: "100 g raw", proteinG: 1.4, carbsG: 11.1, fatG: 0.4, calories: 48, mealType: "Snack", category: "Fruits", emoji: "🍑" },
  { id: "fr-pomegranate", name: "Pomegranate arils", serving: "100 g raw", proteinG: 1.7, carbsG: 18.7, fatG: 1.2, calories: 83, mealType: "Snack", category: "Fruits", emoji: "🍎" },
  { id: "fr-fig", name: "Figs (fresh)", serving: "100 g raw", proteinG: 0.8, carbsG: 19.2, fatG: 0.3, calories: 74, mealType: "Snack", category: "Fruits", emoji: "🫒" },
  { id: "fr-datemedjool", name: "Dates (Medjool)", serving: "100 g", proteinG: 1.8, carbsG: 75.0, fatG: 0.2, calories: 277, mealType: "Snack", category: "Fruits", emoji: "🌴" },
  { id: "fr-datedeglet", name: "Dates (Deglet Noor)", serving: "100 g", proteinG: 2.4, carbsG: 75.0, fatG: 0.4, calories: 282, mealType: "Snack", category: "Fruits", emoji: "🌴" },
  { id: "fr-raisin", name: "Raisins", serving: "100 g", proteinG: 3.1, carbsG: 79.2, fatG: 0.5, calories: 299, mealType: "Snack", category: "Fruits", emoji: "🍇" },
  { id: "fr-prune", name: "Prunes (dried plums)", serving: "100 g", proteinG: 2.2, carbsG: 63.9, fatG: 0.4, calories: 240, mealType: "Snack", category: "Fruits", emoji: "🟤" },
  { id: "fr-driedapricot", name: "Dried apricots", serving: "100 g", proteinG: 3.4, carbsG: 62.6, fatG: 0.5, calories: 241, mealType: "Snack", category: "Fruits", emoji: "🍑" },
  { id: "fr-driedfig", name: "Dried figs", serving: "100 g", proteinG: 3.3, carbsG: 63.9, fatG: 0.9, calories: 249, mealType: "Snack", category: "Fruits", emoji: "🫒" },
  { id: "fr-avocado", name: "Avocado", serving: "100 g raw", proteinG: 2.0, carbsG: 8.5, fatG: 14.7, calories: 160, mealType: "Snack", category: "Fruits", emoji: "🥑" },
  { id: "fr-olivegreen", name: "Olives (green, pickled)", serving: "100 g", proteinG: 1.0, carbsG: 3.8, fatG: 15.3, calories: 145, mealType: "Snack", category: "Fruits", emoji: "🫒" },
  { id: "fr-coconut", name: "Coconut meat (fresh)", serving: "100 g raw", proteinG: 3.3, carbsG: 15.2, fatG: 33.5, calories: 354, mealType: "Snack", category: "Fruits", emoji: "🥥" },
  { id: "fr-banana-plantain", name: "Plantain (raw)", serving: "100 g raw", proteinG: 1.3, carbsG: 31.9, fatG: 0.4, calories: 122, mealType: "Snack", category: "Fruits", emoji: "🍌" },
  { id: "fr-persimmon", name: "Persimmon", serving: "100 g raw", proteinG: 0.6, carbsG: 18.6, fatG: 0.2, calories: 70, mealType: "Snack", category: "Fruits", emoji: "🍅" },
  { id: "fr-dragonfruit", name: "Dragon fruit (pitaya)", serving: "100 g raw", proteinG: 1.2, carbsG: 13.0, fatG: 0.4, calories: 60, mealType: "Snack", category: "Fruits", emoji: "🐉" },
  { id: "fr-passionfruit", name: "Passion fruit", serving: "100 g raw", proteinG: 2.2, carbsG: 23.4, fatG: 0.7, calories: 97, mealType: "Snack", category: "Fruits", emoji: "🥭" },
  { id: "fr-lychee", name: "Lychee", serving: "100 g raw", proteinG: 0.8, carbsG: 16.5, fatG: 0.4, calories: 66, mealType: "Snack", category: "Fruits", emoji: "🍒" },
  { id: "fr-starfruit", name: "Starfruit (carambola)", serving: "100 g raw", proteinG: 1.0, carbsG: 6.7, fatG: 0.3, calories: 31, mealType: "Snack", category: "Fruits", emoji: "⭐" },
  { id: "fr-jackfruit", name: "Jackfruit", serving: "100 g raw", proteinG: 1.7, carbsG: 23.2, fatG: 0.6, calories: 95, mealType: "Snack", category: "Fruits", emoji: "🥭" },
  { id: "fr-guanabana", name: "Soursop (guanabana)", serving: "100 g raw", proteinG: 1.0, carbsG: 16.8, fatG: 0.3, calories: 66, mealType: "Snack", category: "Fruits", emoji: "🍈" },
  { id: "fr-tangerinejuice", name: "Orange juice (fresh)", serving: "100 g / ~100 ml", proteinG: 0.7, carbsG: 10.4, fatG: 0.2, calories: 45, mealType: "Breakfast", category: "Fruits", emoji: "🧃" },
  { id: "fr-applesauce", name: "Applesauce (unsweetened)", serving: "100 g", proteinG: 0.2, carbsG: 11.3, fatG: 0.1, calories: 42, mealType: "Snack", category: "Fruits", emoji: "🍎" },
  { id: "fr-mulberry", name: "Mulberries", serving: "100 g raw", proteinG: 1.4, carbsG: 9.8, fatG: 0.4, calories: 43, mealType: "Snack", category: "Fruits", emoji: "🍇" },
  { id: "fr-gooseberry", name: "Gooseberries", serving: "100 g raw", proteinG: 0.9, carbsG: 10.2, fatG: 0.6, calories: 44, mealType: "Snack", category: "Fruits", emoji: "🍏" },
  { id: "fr-rhubarb", name: "Rhubarb", serving: "100 g raw", proteinG: 0.9, carbsG: 4.5, fatG: 0.2, calories: 21, mealType: "Snack", category: "Fruits", emoji: "🌱" },
  { id: "fr-quince", name: "Quince", serving: "100 g raw", proteinG: 0.4, carbsG: 15.3, fatG: 0.1, calories: 57, mealType: "Snack", category: "Fruits", emoji: "🍐" },
  { id: "fr-tamarind", name: "Tamarind", serving: "100 g raw", proteinG: 2.8, carbsG: 62.5, fatG: 0.6, calories: 239, mealType: "Snack", category: "Fruits", emoji: "🫘" },
  { id: "fr-cactuspear", name: "Prickly pear (cactus fruit)", serving: "100 g raw", proteinG: 0.7, carbsG: 9.6, fatG: 0.5, calories: 41, mealType: "Snack", category: "Fruits", emoji: "🌵" },
];

export const LIBRARY_CATEGORIES: { id: LibraryCategory | "All"; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Saudi", label: "🇸🇦 Saudi" },
  { id: "Fruits", label: "🍎 Fruits" },
  { id: "Protein", label: "Protein" },

  { id: "Carbs", label: "Carbs" },
  { id: "Meals", label: "Meals" },
  { id: "Breakfast", label: "Breakfast" },
  { id: "Snacks", label: "Snacks" },
  { id: "Restaurant", label: "Restaurant" },
];

