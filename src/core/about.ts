import type { AboutDuyetData } from "./types.js";

/**
 * Calculate years of experience since 2017
 */
export function calculateYearsOfExperience(): number {
  const currentYear = new Date().getFullYear();
  return currentYear - 2017;
}

/**
 * Get comprehensive about Duyet data
 */
export function getAboutDuyetData(): AboutDuyetData {
  const yearsOfExperience = calculateYearsOfExperience();
  const content = `I'm Duyet, Data Engineer with ${yearsOfExperience} years of experience.

I am confident in my knowledge of Data Engineering concepts,
best practices and state-of-the-art data and Cloud technologies.

Check out my blog at https://blog.duyet.net, my cv at https://duyet.net/cv,
and my projects at https://github.com/duyet`;

  return {
    content: content.trim(),
    yearsOfExperience,
    profileUrl: "https://duyet.net",
    blogUrl: "https://blog.duyet.net",
    githubUrl: "https://github.com/duyet",
    cvUrl: "https://duyet.net/cv",
  };
}
