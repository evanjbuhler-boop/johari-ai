-- Expand all stories to approximately 2x length with richer narrative detail

-- Update existing 3 core stories
UPDATE public.stories 
SET content = 'A prince was walking through a dense forest when he came upon a tigress, weak from hunger and utterly desperate. She was so starved that she was about to eat her own newborn cubs to survive. The prince stopped and observed this tragic scene, his heart filled with overwhelming compassion for both the mother and her innocent young.

He sat beneath a tree and contemplated deeply what he was witnessing. The tigress was not evil—she was a mother driven to an unthinkable act by the cruelty of starvation. Her cubs would die either way: consumed by their mother or left to starve without her milk. In this moment, the prince saw that true compassion sometimes demands the ultimate sacrifice.

After hours of contemplation, he made an extraordinary decision. He would offer his own body to the tigress so she could eat and regain strength to care for her cubs. He climbed to a cliff above where she lay and, with a prayer for all beings who suffer, threw himself down. His sacrifice gave the tigress the nourishment she needed to survive and nurse her cubs to health. This act of ultimate selflessness and compassion became one of the most powerful teachings in Buddhist tradition about the depths of love and sacrifice possible in the human heart—showing that the highest form of compassion transcends even our instinct for self-preservation.'
WHERE title = 'The Starving Tigress';

UPDATE public.stories 
SET content = 'A young mother named Kisa Gotami was utterly devastated when her only child, a beautiful toddler, died suddenly and without warning. Unable to accept this crushing loss, she refused to believe her child was truly gone. In her grief-stricken state, she carried the lifeless body from house to house throughout her village, desperately begging for medicine to revive him. Most people turned her away, some with pity, others with discomfort at her denial of reality.

Finally, someone who recognized her suffering directed her to seek out the Buddha. When she found him, Kisa Gotami fell at his feet and begged him to bring her child back to life. The Buddha listened with deep compassion, his eyes reflecting her pain without judgment. Then he said something unexpected: he could help her—but first, she must bring him a single mustard seed from a household that has never experienced death.

Filled with renewed hope, Kisa Gotami rushed from door to door throughout the village and beyond. At each house, people were willing to give her mustard seeds—they were common enough. But when she asked if anyone in their family had ever died, the answer was always yes. One family had lost a grandmother last year. Another had buried a child years ago. A third house had lost both parents to illness. As the day wore on and she visited house after house, a profound realization began to dawn on her.

Death touches every family. Loss is woven into the fabric of every human life. She was not being singled out by fate—suffering is universal. As the sun set, she returned to the Buddha without a mustard seed but with a transformed heart. She finally understood: she was not alone in her grief. Loss is part of the human experience. This understanding brought her the first genuine peace she had felt since her child died, and she asked to become the Buddha''s student.'
WHERE title = 'The Mustard Seed';

UPDATE public.stories 
SET content = 'There was once a venomous cobra that lived near a busy village path. Day after day, it would strike at anyone who passed by—children walking to school, farmers heading to their fields, elderly people traveling to the temple. The entire village lived in fear of this serpent, and several people had already died from its bites. The snake seemed to take pleasure in terrorizing travelers, striking without provocation or mercy.

One day, a wise and fearless monk walked past, and the snake lunged forward to bite him. But the monk remained completely unmoved and calm, looking at the snake not with fear or anger, but with genuine compassion. He spoke gently: "You are causing so much suffering—to others and ultimately to yourself. This path of violence will only lead to your own destruction. Please, I beg you, stop biting people."

The snake was so moved by the monk''s peaceful presence and genuine concern that it agreed to change its ways. From that day forward, it stopped attacking villagers. It allowed people to pass unmolested, no longer lunging or hissing. Months passed, and the monk continued his travels.

When the monk returned to that path many months later, he found the snake bruised, battered, covered in wounds, and pitifully weak. Children had thrown stones at it. Adults had beaten it with sticks. The snake was barely alive. Seeing the monk, it said sadly: "I did exactly what you told me. I stopped biting people. And look what has happened—they have nearly killed me."

The monk smiled gently, his eyes full of wisdom and compassion, and replied: "I told you not to bite—but I never said you could not hiss." The snake suddenly understood the profound lesson: compassion does not mean allowing others to harm you. You can be kind without becoming a victim. You can set firm boundaries without resorting to cruelty. True wisdom means knowing when to show your teeth without using them.'
WHERE title = 'The Angry Snake';

-- Update Buddhist stories
UPDATE public.stories 
SET content = 'The Buddha was teaching his disciples when someone asked him about the nature of human suffering and why we experience so much pain beyond what life necessarily brings. The Buddha responded with a powerful teaching that has echoed through 2,500 years.

"Imagine," he said, "that you are struck by an arrow. The pain is immediate, sharp, and unavoidable. This is the first arrow—the actual painful event that happens in life. Someone you love dies. You lose your job. You become ill. A relationship ends. These things happen, and they hurt. This pain is real and legitimate."

He continued: "But then, immediately after being struck by this first arrow, we pick up a second arrow and shoot ourselves with it. This second arrow is our reaction to the pain—our resistance, our rumination, our stories about what the pain means. We think: Why did this happen to ME? What did I do to deserve this? My life is ruined. I will never recover. This should not be happening."

"The first arrow," the Buddha explained, "is the unavoidable pain that comes with having a human body and a human heart. We will all experience loss, aging, sickness, disappointment, and death. But the second arrow—the layers of suffering we add through our resistance, our rumination, our catastrophizing—this arrow is optional. We can choose not to shoot ourselves with it."

This teaching reveals a profound truth: our suffering often comes not from the painful event itself, but from our relationship to that pain, our resistance to what is, and our insistence that reality should be different than it is.'
WHERE title = 'The Second Arrow';

UPDATE public.stories 
SET content = 'A fierce samurai, known throughout the land for his skill and strength, sought out a humble Zen monk who was said to possess great wisdom. The warrior barged into the monk''s chamber and demanded in a commanding voice: "Explain to me the nature of heaven and hell!"

The monk looked up at this intimidating figure and, without hesitation, replied with contempt: "Explain it to you? You are nothing but a crude, ignorant brute. Your mind is as dull as your sword skills are overrated. You probably cannot even follow a simple teaching. Why should I waste my words on someone so clearly beneath me?"

The samurai''s face turned red with rage. No one spoke to him this way—he was a master warrior, feared and respected! His hand flew to his sword, and he drew the blade halfway from its sheath, ready to cut down this insolent monk for his disrespect. His entire body trembled with fury, consumed by the desire for revenge.

At that exact moment, the monk looked calmly into the samurai''s eyes and said quietly: "That is hell."

The samurai froze. In that instant, he saw with perfect clarity what the monk was teaching him. Hell was not some place he would go after death—it was the state he was in right now. The burning rage, the overwhelming compulsion to violence, the complete loss of control, the imprisonment in his own anger—this was hell. He was experiencing it in this very moment, created entirely by his own reaction.

The samurai''s face softened. Understanding washed over him like cool water. He released his grip on the sword, let it fall back into its sheath, and bowed deeply to the monk with genuine gratitude and respect.

The monk smiled gently and said: "And that is heaven."'
WHERE title = 'The Monk and the Samurai';

UPDATE public.stories 
SET content = 'Two monks were traveling together down a muddy road after heavy rains. They came upon a beautiful woman in fine silk robes standing at the edge of a large puddle. She needed to cross but could not without ruining her expensive clothing.

Without hesitation, the older monk approached her, lifted her in his arms, and carried her across the muddy stretch to dry ground on the other side. He set her down gently, she bowed in gratitude, and the monks continued on their journey.

Hours passed as they walked in silence. The younger monk became increasingly agitated, his mind churning with thoughts. Finally, as evening approached and they neared their monastery, he could no longer contain himself. He turned to the older monk and said with irritation: "How could you do that? You know our order forbids us from touching women, let alone carrying them! You violated our sacred vows!"

The older monk looked at his companion with gentle amusement and replied: "Brother, I set that woman down hours ago at the edge of the road. Why are you still carrying her?"

The younger monk suddenly realized the truth: for hours, he had been mentally reliving that moment, judging it, arguing with it, building a story about what it meant. While the older monk had helped someone in need and moved on, the younger monk had picked up that moment and carried it with him for miles, growing heavier with each step.

The teaching was clear: we often carry burdens—resentments, regrets, judgments, perceived slights—long after we could have simply set them down and walked free.'
WHERE title = 'The Muddy Road';