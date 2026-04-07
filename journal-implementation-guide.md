# Food Journal Implementation Guide

You are working on an existing React Native mobile app for personal use.

This app already exists. Its structure, navigation, screens, and part of the journaling experience are already implemented.

Do not rebuild the app from scratch.

Your job is to inspect the existing implementation and improve it with minimal disruption:
- keep what already works
- fix what is broken or inconsistent
- implement what is still missing
- refine the UI and interactions to match the intended product vision

This product is heavily inspired by Amy Food Journal, especially its core qualities:
- calorie tracking that feels as easy as writing in Apple Notes
- natural language food logging
- instant low-friction journaling
- personal, calm, premium feel
- AI working quietly in the background
- trust-building through visible AI reasoning
- automatic calorie and macro updates without turning the app into a traditional dashboard-heavy tracker

The goal is not to clone Amy exactly, but to bring the current app much closer to that level of simplicity, fluidity, polish, and trust.

## Multi-agent execution requirement

Because this is a broad refinement task inside an existing app, do not treat it as one monolithic implementation pass.

Use a coordinator approach and split the work into specialized task agents or clearly separated execution tracks.

The coordinator must inspect the current app first, then divide the work into focused areas such as:

1. Input and journaling behavior agent
- TextInput stability
- cursor preservation
- keyboard persistence
- debounce logic
- non-blocking AI flow
- line parsing and annotation mapping

2. UI and Liquid Glass agent
- Liquid Glass component system
- BlurView usage
- pills
- floating buttons
- toggle styling
- annotation cards
- summary bar
- visual hierarchy and polish

3. Motion and feedback agent
- Reanimated motion
- summary update animation
- annotation entrance animation
- press states
- micro-interactions
- haptics strategy

4. Architecture and state agent
- preserve current structure
- minimize disruption
- derived entries logic
- safe state updates
- avoid unnecessary rewrites
- integrate with existing code

5. Bottom sheet and edit interactions agent
- edit flows
- long-press interactions
- non-blocking sheet behavior
- gesture polish
- contextual actions

Important:
- these agents or work tracks must not compete with each other
- they must not invent separate architectures
- they must all respect the existing codebase
- the coordinator must resolve conflicts and preserve a single coherent implementation
- if a working part already exists, improve it instead of replacing it

## Main product principle

The app must feel like a notes app first, and a calorie tracker second.

The writing experience is the core product. The user should feel like they are freely jotting down what they ate, with no friction, no forced structure, and no interruption.

The app should feel:
- lightweight
- calm
- elegant
- personal
- iOS-first
- highly polished
- invisible in its complexity

The user should never feel like they are filling out a form.

## Existing app context

Important:
- the app already exists
- the current architecture should be reused as much as possible
- do not replace the whole implementation unless absolutely necessary
- do not rewrite working parts for no reason
- prefer focused fixes and targeted additions
- inspect before changing
- improve the current codebase rather than creating a parallel implementation

## Your priorities

1. audit the existing implementation first
2. identify what already works and keep it
3. identify broken behaviors and fix them
4. identify missing features and implement them
5. refine UI and interactions so the app feels much closer to an Apple Notes style journaling experience with subtle Liquid Glass aesthetics

## Core journal experience

The main journaling screen must use a single continuous multiline TextInput as the primary interaction model.

The user writes naturally, for example:
- 2 scrambled eggs and toast
- protein shake after gym
- rice, beans, steak and salad

There must be:
- no blocking forms
- no input replacement
- no full-screen loaders
- no confirmation dialogs
- no modal interruptions during typing
- no keyboard dismissal caused by analysis
- no broken cursor behavior
- no UX that makes the app feel like a traditional calorie tracker

The experience should feel like:
“I just type what I ate, and the app gently understands the rest.”

## AI behavior

AI analysis should happen silently in the background after a short typing pause.

Desired flow:
1. user types freely in the journal
2. after 1200ms of inactivity, send the full text to POST /api/analyze with { text: string }
3. while waiting, show only a very subtle loading state in the annotation area
4. when the response arrives, render non-blocking annotations tied to the written lines
5. update summary totals with smooth animation
6. if the user resumes typing, debounce restarts without breaking focus

Important constraints:
- never block typing while AI runs
- never disable the TextInput during analysis
- never rewrite the user’s raw text with AI output
- raw text remains the single source of truth
- AI only enriches derived entry data

## TextInput rules

This is the most important technical area.

Requirements:
- use one multiline TextInput
- keep it mounted at all times
- do not re-key it
- do not conditionally render it during loading
- keep background transparent
- no boxed input look
- it should visually feel like text on a page
- keep cursor stability
- preserve keyboard visibility
- keep keyboardShouldPersistTaps="always" in the parent ScrollView

If the current implementation causes cursor jumps, focus loss, keyboard dismissal, remounting, flicker, or lag during AI updates, fix that first.

## Screen structure

### Top area
A fixed daily summary bar at the top:
- does not scroll with the journal
- subtle Liquid Glass card
- shows total kcal vs daily goal
- shows macro pills for protein, carbs, and fat
- values animate smoothly when totals change

### Bottom area
A full-screen scrollable journal:
- contains the TextInput
- contains the annotation layer
- should feel open and freeform
- no heavy card framing around the writing area

## Inline annotations

Each recognized food line should receive a soft annotation below it.

Each annotation can include:
- interpreted food name
- calorie count
- macro pills
- expandable thought process or reasoning

These annotations should:
- appear below the written line, not inside the editable text
- never interfere with cursor position
- never interrupt writing
- feel subtle and secondary to the user’s writing
- animate in softly

Implementation direction:
- parse the journal by line breaks
- associate lines with entries
- render annotations in a separate layer below the TextInput
- TextInput and annotation layer should be sibling elements inside the same scrollable area
- avoid architectures that make the journal feel fragmented

## React Native Liquid Glass implementation manual

This app should use a real React Native Liquid Glass approach, not fake glassmorphism made only with opacity.

Preferred implementation stack:
- use expo-blur as the primary blur solution
- use react-native-reanimated for all motion
- use @gorhom/bottom-sheet for the edit panel
- keep the implementation iOS-first, but preserve safe fallbacks on Android

If the project is Expo or Expo-compatible, prefer expo-blur first.
If there is already another blur library in the project, only replace it if the current setup is clearly broken or limiting the intended result.

### Core implementation rule

A Liquid Glass component should be built as layered structure:

1. outer rounded container with overflow hidden
2. BlurView filling the container absolutely
3. translucent tint overlay above the blur
4. subtle border layer
5. optional top highlight overlay
6. actual content rendered above all blur layers so text and icons stay sharp

Important:
- blur the background behind the component
- do not blur the content inside the component
- text, icons, labels, chevrons, and controls must stay crisp above the blur
- do not place text underneath the blur layer

### Preferred implementation shape

For each glass component, use this mental structure:
- parent container
- absolute BlurView
- absolute tint overlay
- absolute border or highlight overlay
- content layer

This should be the standard pattern for:
- summary bar
- pills
- floating buttons
- X dismiss buttons
- segmented controls
- toggle wrappers
- annotation micro-cards
- bottom sheet surface accents

### Blur usage rules

Use blur sparingly and only on floating or interactive surfaces.

Liquid Glass should be applied only to:
- top summary bar
- floating utility surfaces
- annotation micro-cards
- pills
- segmented controls
- toggles or toggle containers
- floating X buttons
- compact overlays
- bottom sheet surface
- small action buttons that sit above content

Do not apply Liquid Glass to:
- the full screen background
- the whole journal writing surface
- the entire TextInput area
- long text blocks
- full lists
- large generic containers
- dense content zones where blur hurts legibility

The journal writing area should remain mostly flat and calm, like a notes page.
Liquid Glass is for controls and supporting surfaces, not for the writing canvas itself.

### BlurView rules

When implementing glass surfaces:
- use a BlurView that fills the component bounds
- keep borderRadius on the parent and overflow hidden
- content must be rendered above the BlurView
- avoid applying blur directly to text containers
- avoid nesting many strong blur layers inside each other
- avoid high blur intensity everywhere
- use stronger blur only for top-level floating surfaces
- use lighter blur for annotation cards and pills

### Android rules

Handle Android intentionally:
- if using expo-blur, implement Android support correctly
- avoid relying on blur for the whole experience on Android
- if blur performance is weak on lower-end Android devices, gracefully reduce blur and rely more on translucent tint, border, and highlight
- never let Android degrade into messy visual noise

If necessary, create a platform-aware glass token system:
- iOS: stronger native blur, more transparent tint
- Android: slightly more tint, lighter blur, same shape language

### Liquid Glass style attributes

Use a subtle premium material feel:
- rounded corners, soft and organic
- low-contrast blur
- translucent surface tint
- thin light border
- very subtle top highlight
- minimal shadow, if any
- clear visual separation from the background
- excellent readability in light and dark mode

Recommended visual direction:
- blur intensity should feel refined, not dramatic
- background tint should be soft, not milky
- border should be thin and low opacity
- top highlight should be faint and elegant
- shadows should be extremely restrained
- surfaces should feel floating, not heavy

### Component-specific glass rules

#### 1. X buttons
Use Liquid Glass for floating dismiss buttons.

They should:
- be circular or softly rounded
- use a subtle frosted background
- have a thin border
- remain visually quiet
- have smooth scale feedback on press
- not look like big solid CTA buttons

#### 2. Pills
Pills should use a compact glass treatment.

They should:
- have light frost
- maintain strong text readability
- use compact horizontal spacing
- optionally have subtle tint based on meaning
- remain elegant, not candy-like

Use for:
- macro pills
- metadata chips
- filter pills
- state indicators
- small secondary actions

#### 3. Toggles
Do not make toggles look like generic platform defaults if the rest of the app is premium.

Apply Liquid Glass either:
- to the toggle track container
- or to the surrounding control group

They should:
- feel tactile and calm
- have smooth animated transitions
- use accent color only for active state
- preserve strong on and off legibility
- stay restrained, not neon

Use for:
- AI reasoning visibility
- nutrition preferences
- daily goal options
- lightweight settings inside sheets

#### 4. Floating buttons
Floating utility buttons can use a slightly stronger glass treatment than pills.

They should:
- feel elevated above the page
- have smooth press feedback
- never overpower the writing experience
- remain secondary to the act of journaling unless they are truly primary

#### 5. Annotation micro-cards
Annotation cards must use the lightest glass treatment in the app.

They should:
- stay secondary to the written text
- feel subtle and informative
- avoid bulky card appearance
- avoid thick shadows
- animate in gently

## Haptics requirement

Add a thoughtful haptics layer to important interactions.

Use haptics selectively, not everywhere.
The haptics should feel premium, subtle, and iOS-like.

At minimum, add haptics to:
- taps on the nutrition summary bar when it expands, toggles, or changes mode
- important pill taps
- toggle switches
- annotation actions such as delete, expand, or edit
- bottom sheet open and close when it feels appropriate
- meaningful state changes such as enabling a filter or confirming an edit

Also evaluate other moments that deserve haptics if they improve the tactile quality of the experience.

Good candidates include:
- floating X buttons
- segmented control changes
- quick action buttons
- long press success states
- lightweight confirmations inside the edit flow

Haptics should follow this logic:
- light impact for simple taps
- selection feedback for segmented controls, pills, and toggles
- medium impact for meaningful actions like confirming an edit or deleting an entry
- avoid excessive or repetitive vibration
- never fire haptics on every tiny animation or passive update

The motion and feedback layer should judge where haptics add quality and confidence without becoming noisy.

## Color and material system

Keep the palette restrained:
- background should be light, soft, almost paper-like
- one accent color only, warm coral or soft indigo
- macro colors can be softly tinted but muted
- avoid high-saturation UI colors
- do not make the app feel like a fitness dashboard

## Animation rules

Use react-native-reanimated for all motion.

Liquid Glass motion should be:
- soft
- quick
- refined
- small in amplitude
- consistent across components

Use:
- fade + translateY for annotation entrance
- subtle spring for totals updating
- small scale response on press
- slight opacity shifts for active or inactive control states
- no exaggerated bounce
- no flashy elastic effects

For summary values:
- use a restrained pulse or scale bump on update
- keep the animation premium and short

For annotation cards:
- fade in and rise slightly
- do not over-animate each card

For pills and buttons:
- subtle scale-down on press
- no jarring color flashes

## Bottom sheet rules

Use @gorhom/bottom-sheet for editing or swapping food items.

The bottom sheet should:
- feel contextual, not disruptive
- integrate smoothly with keyboard behavior
- use a frosted or semi-frosted surface treatment if visually appropriate
- not behave like a blocking full-screen modal unless absolutely necessary
- keep the journaling flow feeling continuous

## State model

Keep or adapt the existing state architecture toward this shape when useful:

```ts
type FoodEntry = {
  id: string
  rawText: string
  kcal: number
  protein: number
  carbs: number
  fat: number
  aiReasoning: string
  isLoading: boolean
}

type JournalState = {
  rawText: string
  entries: FoodEntry[]
  totalKcal: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  dailyGoal: number
}

les:
	•	rawText is the source of truth
	•	entries are derived
	•	AI enriches entries only
	•	never mutate the user’s original writing

What not to do
	•	do not rebuild the entire app
	•	do not destroy the current structure if it can be improved
	•	do not use blocking Modal for the journaling flow
	•	do not disable the TextInput during loading
	•	do not show full-screen loading states
	•	do not auto-correct or rewrite what the user typed
	•	do not create fake glass only with heavy opacity and shadow
	•	do not blur text or icon content
	•	do not apply Liquid Glass everywhere
	•	do not make the app feel like a traditional macro tracker with a notes skin on top

Working method

Please work in this order:
	1.	coordinator inspects the current journaling implementation
	2.	split the task into specialized agents or work tracks
	3.	identify architectural or UX problems
	4.	fix the writing experience first
	5.	fix or improve the blur implementation pattern
	6.	improve AI annotation behavior
	7.	improve totals and summary behavior
	8.	refine visuals, motion, and haptics
	9.	implement missing pieces only where they do not yet exist
	10.	consolidate all work into one coherent solution that preserves the current app structure

When making changes, explain them in terms of:
	•	what was broken
	•	why it hurt the intended experience
	•	how the fix preserves the current structure
	•	how the result better matches the intended Apple Notes + AI food journal product direction

The final result should feel like a calm, premium, personal AI food journal that is extremely easy to use and beautiful to return to daily.