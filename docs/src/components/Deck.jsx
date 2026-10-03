import { useState, useEffect } from 'react'
import Card from './Card'
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Deck = ({ cards }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [direction, setDirection] = useState(0)
    const [isFlipped, setIsFlipped] = useState(false)

    const nextCard = () => {
        setDirection(1)
        setIsFlipped(false)
        setCurrentIndex((prev) => (prev + 1) % cards.length)
    }

    const prevCard = () => {
        setDirection(-1)
        setIsFlipped(false)
        setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }

    const shuffleDeck = () => {
        const randomIndex = Math.floor(Math.random() * cards.length)
        setDirection(1)
        setIsFlipped(false)
        setCurrentIndex(randomIndex)
    }

    // Keyboard Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') {
                nextCard();
            } else if (e.key === 'ArrowLeft') {
                prevCard();
            } else if (e.key === ' ') {
                e.preventDefault(); // Prevent scrolling
                setIsFlipped(prev => !prev);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cards.length]);

    const handleDragEnd = (event, info) => {
        // Threshold for swipe
        if (info.offset.x < -100) {
            nextCard()
        } else if (info.offset.x > 100) {
            prevCard()
        }
    }

    if (!cards || cards.length === 0) return null

    return (
        <div className="flex flex-col items-center gap-8 w-full max-w-[95%] h-full justify-center">

            {/* Swipeable Area */}
            <div className="relative w-full aspect-video flex items-center justify-center">
                <AnimatePresence initial={false} mode="wait" custom={direction}>
                    <motion.div
                        key={currentIndex}
                        custom={direction}
                        variants={{
                            enter: (direction) => ({
                                x: direction > 0 ? 300 : -300,
                                opacity: 0,
                                scale: 0.8
                            }),
                            center: {
                                zIndex: 1,
                                x: 0,
                                opacity: 1,
                                scale: 1
                            },
                            exit: (direction) => ({
                                zIndex: 0,
                                x: direction < 0 ? 300 : -300,
                                opacity: 0,
                                scale: 0.8
                            })
                        }}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{
                            x: { type: "spring", stiffness: 300, damping: 30 },
                            opacity: { duration: 0.2 }
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={1}
                        onDragEnd={handleDragEnd}
                        style={{ transformStyle: 'preserve-3d', WebkitTransformStyle: 'preserve-3d' }}
                        className="absolute w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
                    >
                        <Card
                            card={cards[currentIndex]}
                            isFlipped={isFlipped}
                            onFlip={() => setIsFlipped(!isFlipped)}
                        />
                    </motion.div>
                </AnimatePresence>
            </div>

            <div className="flex items-center gap-6 bg-gray-800 p-4 rounded-full shadow-lg border border-gray-700 z-10">
                <button
                    onClick={prevCard}
                    className="p-2 hover:bg-gray-700 rounded-full transition-colors text-white"
                    title="Previous"
                >
                    <ChevronLeft size={24} />
                </button>

                <span className="text-gray-400 font-mono">
                    {currentIndex + 1} / {cards.length}
                </span>

                <button
                    onClick={nextCard}
                    className="p-2 hover:bg-gray-700 rounded-full transition-colors text-white"
                    title="Next"
                >
                    <ChevronRight size={24} />
                </button>

                <div className="w-px h-6 bg-gray-700 mx-2"></div>

                <button
                    onClick={shuffleDeck}
                    className="p-2 hover:bg-purple-600 rounded-full transition-colors text-purple-400 hover:text-white"
                    title="Random"
                >
                    <Shuffle size={20} />
                </button>
            </div>

            {/* Hint for Keyboard Users */}
            <div className="hidden md:block text-xs text-gray-500 font-mono mt-[-10px]">
                Space: Flip • Arrows: Navigate
            </div>
        </div>
    )
}

export default Deck
