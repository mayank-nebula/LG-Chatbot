export const getRandomEventTitle = (eventName: string): string => {
  const titles = [
    `Starting in 15 minutes: ${eventName}`,
    `15 Minute Warning: ${eventName} is about to start`,
    `Grab your coffee, ${eventName} starts soon`,
    `It's almost time! Join ${eventName} now`,
    `Don't miss out: ${eventName} goes live shortly`,
  ];

  // Pick one randomly
  const randomIndex = Math.floor(Math.random() * titles.length);
  
  return titles[randomIndex];
};
