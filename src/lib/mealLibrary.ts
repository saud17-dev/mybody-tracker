// Static meal library with approximate nutrition per standard serving.
// Values are rounded estimates suitable for daily tracking.

export type LibraryCategory =
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
  approximate?: boolean;
}

export const MEAL_LIBRARY: LibraryMeal[] = [
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
];

export const LIBRARY_CATEGORIES: { id: LibraryCategory | "All"; label: string }[] = [
  { id: "All", label: "All" },
  { id: "Protein", label: "Protein" },
  { id: "Carbs", label: "Carbs" },
  { id: "Meals", label: "Meals" },
  { id: "Breakfast", label: "Breakfast" },
  { id: "Snacks", label: "Snacks" },
  { id: "Restaurant", label: "Restaurant" },
];
