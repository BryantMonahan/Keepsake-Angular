import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'highlight',
})
export class HighlightPipe implements PipeTransform {
  transform(value: string | null | undefined, keywords: string[]): string {
    if (!value) return ""
    keywords = keywords.filter(w => w.trim().length > 0)
    if (keywords.length === 0) return value
    // create a regex pattern that uses all the keywords provided
    // longest first, so "category" wins over "cat" when both are keywords
    const pattern = [...keywords].sort((a, b) => b.length - a.length).map(w => escapeRegex(w)).join('|')
    const re = new RegExp(`(${pattern})`, 'gi')
    return value.replace(re, '<strong>$1</strong>')
  }
}

// takes in a string and escapes any character that could be used to build a regex expression
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}