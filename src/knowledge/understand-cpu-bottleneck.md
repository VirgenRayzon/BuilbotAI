HOOOOKAY

after reading through a bunch of posts, I feel like a lot of people still don't grasp the essence of CPU bottlenecking. It DOES exist, but it's not what a lot of you say it is.

It is NOT bottlenecking when you pair a strong GPU with a weaker CPU (e.g. RTX 3080 with a R5 3600X), which I see many people start to suggest when they see someone with a CPU that is 1 or 2 generations behind their GPUs.

Part 1: How GPUs and CPUs work (skip to part 2 if you dont care about this)

CPU bottle necking is a bit more nuanced. And to understand this, we must first understand what the CPU and GPU does when rendering a frame.

When you play a game, the game is rendered (or drawn) frame by frame (if you're playing at 60 frames per second, the PC does that 60 times a second).

When a frame is rendered, in a super simplified, bastardized sense, 2 things need to be processed: game logic and graphics.

CPU is in charge of processing the game logic. Did your bullet hit the enemy? Did you land on the platform successfully? Was your dodge successful? These are all game logic.

GPU is in charge of processing the graphics. However, in order for the GPU to do its work, the CPU first needs to process some of the work that goes into the GPU. This is on top of the game logic that the CPU needs to do. Will come back to this later.

When a frame is rendered, the PC as a whole, will wait for both the CPU and GPU to finish the work they need for the frame, before the frame is shown.

Part 2: Bottlenecking

If the CPU takes longer to process a frame than the GPU, this means you have SERIOUS bottlenecking and you better get a new CPU (this is super rare, most of you dont have this, and we will come back to this point later).

If the GPU takes longer to process a frame than the CPU, this means you PROBABLY don't have bottlenecking, but it's not over just yet.

Remember we talked about the the CPU needing to do some work before the GPU can render a frame? If your CPU is slow in giving the GPU the information it needs, then it will also cause a bottleneck. However, this bottleneck is often very mild and upgrading your CPU may lead to 5-10% improvement. Whether this is worth it is up to you. Note that we're talking about a system where the CPU is already processing the frame quicker than the GPU.

For some games, the CPU's work isnt as consistent as the GPU's work. So, in some frames, the CPU takes longer than the GPU, which causes STUTTERS (this is what people mean when they say you have a very low 1%/0.1% low frame rate). Stutters, IMO, is the BEST indication of a player needing a new CPU. Note that I chose the word PLAYER, and not SYSTEM. Let me elaborate.

Part 3: It's not about the system, its about the person

Bottlenecking isn't about the system, it's about the games you play on your system, and your preference.

Here is a personal example of how, 1 player, 1 system, can be both CPU bottlenecked and NOT CPU bottlenecked.

System: R9 5900X, RTX 3080, 32GBs 3600 DDR4 RAM, 144hz Monitor.

Case 1: Cyberpunk 2077@4K. Running it around 30-40 FPS. GPU@~100%, GPU bottlenecked.

Case 2: Valheim@4K. Running it around 60-70 FPS. GPU@~40-50% utilization. CPU as a whole is around 12% utilization. However, 2 of the threads were maxed out. Turns out Valheim only runs on one core. CPU bottlenecked, but more like game bottlenecked.

Whether or not you are CPU bottlenecked heavily depends on the games you play, at the settings you want.

Hence, this brings me to my point.

TL;DR:

How to tell if you're CPU bottlenecked (not the complete picture but should cover most peoples cases)

Are you experiencing stutters in the games you play?

Is your GPU utilization rate significantly under 100%? (you might have issues with your system or settings besides the CPU)

Do you think 5-10% more frames will make a difference to you?

If you answer NO for all 3 questions, you probably don't need to upgrade your CPU.