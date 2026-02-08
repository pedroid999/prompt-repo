import { render, screen } from '@testing-library/react'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './command'
import { describe, it, expect } from 'vitest'

describe('Command Component', () => {
  it('renders command palette parts', () => {
    render(
      <Command>
        <CommandInput placeholder="Type a command..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem>Calendar</CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    )
    
    expect(screen.getByPlaceholderText('Type a command...')).toBeDefined()
    expect(screen.getByText('Suggestions')).toBeDefined()
    expect(screen.getByText('Calendar')).toBeDefined()
  })
})
