import clsx from 'clsx'
import React, { useCallback } from 'react'
import { InputEntry, isMatchingChars } from './App'

type SnippetProps = {
  snippet: string
  inputRef: React.RefObject<HTMLInputElement>
  isFocused: boolean
  setIsFocused: React.Dispatch<React.SetStateAction<boolean>>
  currLine: number
  setCurrLine: React.Dispatch<React.SetStateAction<number>>
  currWord: number
  setCurrWord: React.Dispatch<React.SetStateAction<number>>
  currChar: number
  setCurrChar: React.Dispatch<React.SetStateAction<number>>
  setNumSpaceEnterInputs: React.Dispatch<React.SetStateAction<number>>
  input: InputEntry[]
  setInput: React.Dispatch<React.SetStateAction<InputEntry[]>>
  startTime: number | null
  setStartTime: React.Dispatch<React.SetStateAction<number | null>>
  endTime: number | null
  setEndTime: React.Dispatch<React.SetStateAction<number | null>>
}

const Snippet = React.memo(
  ({
    snippet,
    inputRef,
    isFocused,
    setIsFocused,
    currLine,
    setCurrLine,
    currWord,
    setCurrWord,
    currChar,
    setCurrChar,
    setNumSpaceEnterInputs,
    input,
    setInput,
    startTime,
    setStartTime,
    endTime,
    setEndTime
  }: SnippetProps) => {
    const handlePreClick = useCallback(() => {
      inputRef.current?.focus()
    }, [inputRef])

    const handleEnterKey = useCallback(
      (wordsInLine: string[], lines: string[]) => {
        if (currWord !== wordsInLine.length - 1 || currChar === 0) {
          return
        }

        // Move to next non-blank line
        let nextLineIndex = currLine + 1
        while (
          nextLineIndex < lines.length &&
          lines[nextLineIndex].trim() === ''
        ) {
          nextLineIndex++
        }
        if (nextLineIndex < lines.length) {
          setCurrLine(nextLineIndex)
          setCurrWord(0)
          setCurrChar(0)
          const nextLine = lines[nextLineIndex]
          const firstNonBlankWordIndex = nextLine
            .split(' ')
            .findIndex((word) => word.trim() !== '')
          setCurrWord(
            firstNonBlankWordIndex !== -1 ? firstNonBlankWordIndex : 0
          )
          setNumSpaceEnterInputs((prev) => prev + 1)
        }
      },
      [
        currWord,
        currChar,
        currLine,
        setCurrLine,
        setCurrWord,
        setCurrChar,
        setNumSpaceEnterInputs
      ]
    )

    const handleSpaceKey = useCallback(
      (wordsInLine: string[]) => {
        if (currChar === 0 || currWord === wordsInLine.length - 1) {
          return
        }

        // Move to next word
        setCurrWord((prev) => prev + 1)
        setCurrChar(0)
        setNumSpaceEnterInputs((prev) => prev + 1)
      },
      [currChar, currWord, setCurrWord, setCurrChar, setNumSpaceEnterInputs]
    )

    const handleBackspaceKey = useCallback(
      (wordsInLine: string[]) => {
        const firstNonBlankWordIndex = wordsInLine.findIndex(
          (word) => word.trim() !== ''
        )
        if (currChar === 0 && currWord > firstNonBlankWordIndex) {
          // Move to previous word
          setCurrWord((prev) => prev - 1)
          const previousWordEntry = input.find(
            (entry) =>
              entry.lineIndex === currLine && entry.wordIndex === currWord - 1
          )
          setCurrChar(
            previousWordEntry ? previousWordEntry.typedChars.length : 0
          )
          setNumSpaceEnterInputs((prev) => prev - 1)
        } else {
          // Move to previous character
          setCurrChar((prev) => (prev ? prev - 1 : 0))
        }
        setInput((prevInput) => {
          const newInput = [...prevInput]
          const existingEntryIndex = newInput.findIndex(
            (entry) =>
              entry.lineIndex === currLine && entry.wordIndex === currWord
          )
          if (
            existingEntryIndex !== -1 &&
            newInput[existingEntryIndex].typedChars.length > 0
          ) {
            newInput[existingEntryIndex].typedChars.pop()
          }
          return newInput
        })
      },
      [
        currChar,
        currWord,
        currLine,
        setCurrWord,
        setCurrChar,
        setNumSpaceEnterInputs,
        input,
        setInput
      ]
    )

    const handleAlphanumericKey = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        setInput((prevInput) => {
          const newInput = [...prevInput]
          const existingEntryIndex = newInput.findIndex(
            (entry) =>
              entry.lineIndex === currLine && entry.wordIndex === currWord
          )
          if (existingEntryIndex !== -1) {
            newInput[existingEntryIndex].typedChars.push(e.key)
          }

          // Move to next character
          setCurrChar((prev) => prev + 1)

          if (
            currChar === 0 &&
            currWord === 0 &&
            currLine === 0 &&
            !startTime
          ) {
            setStartTime(Date.now())
          } else if (
            // last character of last word of last line
            currLine === snippet.split('\n').length - 1 &&
            currWord === snippet.split('\n')[currLine].split(' ').length - 1 &&
            currChar ===
              snippet.split('\n')[currLine].split(' ')[currWord].length - 1 &&
            isMatchingChars(
              newInput.find(
                (entry) =>
                  entry.lineIndex === currLine && entry.wordIndex === currWord
              ) ?? {
                lineIndex: -1,
                wordIndex: -1,
                actualChars: [],
                typedChars: []
              }
            )
          ) {
            setEndTime(Date.now())
          }

          return newInput
        })
      },
      [
        currChar,
        currWord,
        currLine,
        setCurrChar,
        setStartTime,
        setEndTime,
        snippet,
        startTime,
        setInput
      ]
    )

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (endTime) {
          return
        }

        const wordsInLine = snippet.split('\n')[currLine].split(' ')
        const lines = snippet.split('\n')

        if (e.key === 'Enter') {
          handleEnterKey(wordsInLine, lines)
        } else if (e.key === ' ') {
          handleSpaceKey(wordsInLine)
        } else if (e.key === 'Backspace') {
          handleBackspaceKey(wordsInLine)
        } else if (e.key.length === 1) {
          handleAlphanumericKey(e)
        }
      },
      [
        endTime,
        snippet,
        currLine,
        handleEnterKey,
        handleSpaceKey,
        handleBackspaceKey,
        handleAlphanumericKey
      ]
    )

    const renderSnippet = useCallback(
      (snippet: string) => {
        return snippet.split('\n').map((line, lineIndex) => (
          <div key={lineIndex}>
            {line.split(' ').map((word, wordIndex) => (
              <span key={`${lineIndex}-${wordIndex}`}>
                {word.split('').map((char, charIndex) =>
                  isFocused &&
                  charIndex === currChar &&
                  wordIndex === currWord &&
                  lineIndex === currLine ? (
                    <span key={`${lineIndex}-${wordIndex}-${charIndex}`}>
                      <span className="absolute -translate-x-1 animate-blink text-slate-200">
                        |
                      </span>
                      <span className={clsx(textStyle.incomplete)}>{char}</span>
                    </span>
                  ) : (
                    <span
                      key={`${lineIndex}-${wordIndex}-${charIndex}`}
                      className={clsx(
                        char ===
                          input.find(
                            (entry) =>
                              entry.lineIndex === lineIndex &&
                              entry.wordIndex === wordIndex
                          )?.typedChars[charIndex]
                          ? 'text-slate-200'
                          : charIndex <
                              (input.find(
                                (entry) =>
                                  entry.lineIndex === lineIndex &&
                                  entry.wordIndex === wordIndex
                              )?.typedChars.length ?? 0)
                            ? 'text-red-500'
                            : textStyle.incomplete,
                        !isMatchingChars(
                          input.find(
                            (entry) =>
                              entry.lineIndex === lineIndex &&
                              entry.wordIndex === wordIndex
                          ) ?? {
                            lineIndex: -1,
                            wordIndex: -1,
                            actualChars: [],
                            typedChars: []
                          }
                        ) &&
                          ((currLine == lineIndex && currWord > wordIndex) ||
                            currLine > lineIndex) &&
                          'underline decoration-red-500 decoration-2 underline-offset-2'
                      )}
                    >
                      {char}
                    </span>
                  )
                )}
                {/* Display extra characters typed */}
                {input.find(
                  (entry) =>
                    entry.lineIndex === lineIndex &&
                    entry.wordIndex === wordIndex
                )?.typedChars.length ?? 0 > word.length
                  ? input
                      .find(
                        (entry) =>
                          entry.lineIndex === lineIndex &&
                          entry.wordIndex === wordIndex
                      )
                      ?.typedChars.slice(word.length)
                      .map((char, charIndex) => {
                        return charIndex + word.length + 1 === currChar &&
                          wordIndex === currWord &&
                          lineIndex === currLine ? (
                          <span
                            key={`${lineIndex}-${wordIndex}-${charIndex}`}
                            className="text-red-700"
                          >
                            {char}
                            <span className="absolute -translate-x-1 animate-blink text-slate-200">
                              |
                            </span>
                          </span>
                        ) : (
                          <span
                            key={`${lineIndex}-${wordIndex}-${charIndex}`}
                            className={clsx(
                              'text-red-700',
                              !isMatchingChars(
                                input.find(
                                  (entry) =>
                                    entry.lineIndex === lineIndex &&
                                    entry.wordIndex === wordIndex
                                ) ?? {
                                  lineIndex: -1,
                                  wordIndex: -1,
                                  actualChars: [],
                                  typedChars: []
                                }
                              ) &&
                                (currWord > wordIndex ||
                                  currLine > lineIndex) &&
                                'underline decoration-red-500'
                            )}
                          >
                            {char}
                          </span>
                        )
                      })
                  : null}
                {wordIndex < line.split(' ').length - 1 &&
                  (isFocused &&
                  wordIndex === currWord &&
                  lineIndex === currLine &&
                  word.length === currChar ? (
                    <span key={`space-${lineIndex}-${wordIndex}`}>
                      <span className="absolute -translate-x-1 animate-blink text-slate-200">
                        |
                      </span>{' '}
                    </span>
                  ) : (
                    <span key={`space-${lineIndex}-${wordIndex}`}> </span>
                  ))}
              </span>
            ))}
            {lineIndex < snippet.split('\n').length - 1 && <br />}
          </div>
        ))
      },
      [currLine, currWord, currChar, isFocused, input]
    )

    return (
      <div>
        <pre onClick={handlePreClick} className="cursor-text select-none">
          {renderSnippet(snippet)}
        </pre>
        <input
          className="absolute -top-10"
          ref={inputRef}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
        ></input>
      </div>
    )
  }
)

Snippet.displayName = 'Snippet'

const textStyle = {
  incomplete: 'text-slate-400'
}

export default Snippet
