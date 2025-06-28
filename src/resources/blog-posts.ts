import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { parseDocument } from 'htmlparser2'
import { getElementsByTagName, textContent } from 'domutils'
import type { Element } from 'domhandler'

export interface BlogPost {
  title: string | null
  link: string | null
  description: string | null
  pubDate: string | null
}

export interface ParsedRSSFeed {
  posts: BlogPost[]
  totalFound: number
}
/**
 * Register the blog posts resource with limit parameter
 */
export function registerBlogPostsResource(server: McpServer) {
  server.registerResource(
    'blog-posts',
    new ResourceTemplate('duyet://blog/posts/{limit}', {
      list: undefined,
      complete: {
        limit: (value: string) => {
          const numbers = Array.from({ length: 10 }, (_, i) => String(i + 1))
          return numbers.filter((n) => n.startsWith(value))
        },
      },
    }),
    {
      title: "Duyet's Blog Posts",
      description:
        "Latest blog posts from Duyet's technical blog at blog.duyet.net",
      mimeType: 'text/plain',
    },
    async (uri: URL, { limit = '1' }: { limit?: string }) => {
      try {
        const limitNum = Math.min(Math.max(Number.parseInt(limit) || 1, 1), 10)
        const result = await fetchAndParseRSS(
          'https://blog.duyet.net/rss.xml',
          limitNum
        )

        if (result.posts.length === 0) {
          return {
            contents: [
              {
                uri: uri.href,
                text: 'No blog posts found',
              },
            ],
          }
        }

        const formattedContent = formatBlogPostsForMCP(result.posts)

        return {
          contents: [
            {
              uri: uri.href,
              text: formattedContent,
            },
          ],
        }
      } catch (error) {
        const errorContent = `Error fetching blog posts: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`

        return {
          contents: [
            {
              uri: uri.href,
              text: errorContent,
            },
          ],
        }
      }
    }
  )
}

/**
 * Extract field content from RSS item element, handling CDATA and parsing quirks
 */
export function extractFieldFromElement(
  element: Element,
  tagName: string
): string | null {
  const elements = getElementsByTagName(tagName, element)
  if (elements.length === 0) return null

  const targetElement = elements[0]
  let content = ''

  // Handle different node types
  if (targetElement.children && targetElement.children.length > 0) {
    for (const child of targetElement.children) {
      if (child.type === 'text') {
        content += child.data || ''
      } else if (child.type === 'comment') {
        // Handle CDATA parsed as comment
        let data = child.data || ''
        if (data.startsWith('[CDATA[') && data.endsWith(']]')) {
          data = data.slice(7, -2)
        }
        content += data
      }
    }
  }

  // Fallback to textContent for elements with no children (like link)
  if (!content && tagName === 'link') {
    content = textContent(targetElement).trim()
    // If textContent fails, try next sibling for htmlparser2 parsing issues
    if (!content && targetElement.next?.type === 'text') {
      content = targetElement.next.data?.trim() || ''
    }
  }

  content = content.trim()

  // Handle CDATA sections - remove CDATA wrapper if present
  if (content.startsWith('<![CDATA[') && content.endsWith(']]>')) {
    content = content.slice(9, -3).trim()
  }

  return content || null
}

/**
 * Extract blog post data from RSS item element
 */
export function extractBlogPostFromItem(item: Element): BlogPost {
  return {
    title: extractFieldFromElement(item, 'title'),
    link: extractFieldFromElement(item, 'link'),
    description: extractFieldFromElement(item, 'description'),
    pubDate:
      extractFieldFromElement(item, 'pubDate') ||
      extractFieldFromElement(item, 'pubdate'),
  }
}

/**
 * Parse RSS XML content and extract blog posts
 */
export function parseRSSContent(xml: string, limit = 1): ParsedRSSFeed {
  const doc = parseDocument(xml)
  const items = getElementsByTagName('item', doc)

  if (items.length === 0) {
    return { posts: [], totalFound: 0 }
  }

  const postsToFetch = Math.min(limit, items.length)
  const posts: BlogPost[] = []

  for (let i = 0; i < postsToFetch; i++) {
    const item = items[i]
    const blogPost = extractBlogPostFromItem(item)

    // Remove null values to clean up the output
    const cleanedPost = Object.fromEntries(
      Object.entries(blogPost).filter(
        ([_, value]) => value !== null && value !== undefined
      )
    ) as BlogPost

    posts.push(cleanedPost)
  }

  return {
    posts,
    totalFound: items.length,
  }
}

/**
 * Fetch and parse RSS feed from URL
 */
export async function fetchAndParseRSS(
  url: string,
  limit = 1
): Promise<ParsedRSSFeed> {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch RSS feed: ${response.status} ${response.statusText}`
    )
  }

  const xml = await response.text()
  return parseRSSContent(xml, limit)
}

/**
 * Format blog posts for MCP response
 */
export function formatBlogPostsForMCP(posts: BlogPost[]): string {
  const postList = posts
    .map((post, index) => {
      const postData = JSON.stringify(post, null, 2)
      return `${index + 1}. Blog Post:\n\`\`\`json\n${postData}\n\`\`\``
    })
    .join('\n\n')

  return `Latest ${posts.length} blog post${
    posts.length > 1 ? 's' : ''
  }:\n\n${postList}`
}
