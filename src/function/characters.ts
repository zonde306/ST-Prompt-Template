import { characters, this_chid, user_avatar, getThumbnailUrl, getUserAvatar as getPersonaAvatar } from '../../../../../../script.js';
import { v1CharData } from '../../../../../char-data.js';

/**
 * Get the data of the specified character.
 * @param name Role name/ID/regexp match
 * @returns character data
 */
export function getCharacterData(name : string | RegExp | number | undefined = this_chid) : v1CharData | null {
    name = name || this_chid;
    if(name == null)
        return null;
    
    // @ts-expect-error
    const char = characters[name] || characters.find(c => c.name === name || c.name.match(name));
    if (!char)
        return null;
    return char;
}

/**
 * Get the names of all characters
 * @param include Included list
 * @param exclude Excluded list
 * @returns character names
 */
export function* getCharacters(include: Set<string> = new Set<string>(),
                          exclude: Set<string> = new Set<string>()) : Generator<string> {
    function hasAny(tags: string[], matchs: Set<string>) {
        for (const tag of tags)
            if (matchs.has(tag))
                return true;
        return false;
    }
    for (const char of characters)
        if ((!include.size || hasAny(char.tags, include)) && !hasAny(char.tags, exclude))
            yield char.name;
}

export const DEFAULT_CHAR_DEFINE = `\
<% if (name) { %>\
<<%- name %>>
<% if (system_prompt) { %>\
System: <%- system_prompt %>
<% } %>\
name: <%- name %>
<% if (personality) { %>\
personality: <%- personality %>
<% } %>\
<% if (description) { %>\
description: <%- description %>
<% } %>\
<% if (message_example) { %>\
example:
<%- message_example %>
<% } %>\
<% if (depth_prompt) { %>\
System: <%- depth_prompt %>
<% } %>\
</<%- name %>>\
<% } %>\
`;

export function getCharacterDefine(name : string | RegExp | number | undefined = this_chid) {
    const char = getCharacterData(name);
    if (!char)
        return null;

    /*
     * FROM:
     * <START>
     * {{user}}: Hi Aqua, I heard you like to spend time in the pub.
     * {{char}}: *excitedly* Oh my goodness, yes! I just love spending time at the pub! It's so much fun to talk to all the adventurers and hear about their exciting adventures! And you are?
     * {{user}}: I'm new here and I wanted to ask for your advice.
     * {{char}}: *giggles* Oh, advice! I love giving advice! And in gratitude for that, treat me to a drink! *gives signals to the bartender*
     * <START>
     * {{user}}: Hello
     * {{char}}: *excitedly* Hello there, dear! Are you new to Axel? Don't worry, I, Aqua the goddess of water, am here to help you! Do you need any assistance? And may I say, I look simply radiant today! *strikes a pose and looks at you with puppy eyes*
     *
     * TO:
     * ```
     * User: Hi Aqua, I heard you like to spend time in the pub.
     * Aqua: *excitedly* Oh my goodness, yes! I just love spending time at the pub! It's so much fun to talk to all the adventurers and hear about their exciting adventures! And you are?
     * User: I'm new here and I wanted to ask for your advice.
     * Aqua: *giggles* Oh, advice! I love giving advice! And in gratitude for that, treat me to a drink! *gives signals to the bartender*
     * ```
     * ```
     * User: Hello
     * Aqua: *excitedly* Hello there, dear! Are you new to Axel? Don't worry, I, Aqua the goddess of water, am here to help you! Do you need any assistance? And may I say, I look simply radiant today! *strikes a pose and looks at you with puppy eyes*
     * ```
     */
    let example = char.mes_example.trim();
    if(example && example.startsWith('<START>'))
        example = example.slice(7).trim();
    example = example.replace('<START>', '```\n```');
    if(example && example.includes('```'))
        example += '\n```';

    return {
        name: char.name,
        description: char.description,
        personality: char.personality,
        scenario: char.scenario,
        first_message: char.first_mes,
        message_example: example,
        creator_notes: char.data.creator_notes,
        creatorcomment: char.creatorcomment,
        system_prompt: char.data.system_prompt,
        post_history_instructions: char.data.post_history_instructions,
        alternate_greetings: char.data.alternate_greetings,
        // @ts-expect-error
        depth_prompt: char?.data?.depth_prompt,
        creator: char?.data?.creator,
    };
}

/**
 * Get the user avatar URL
 * @returns URL
 */
export function getUserAvatarURL() : string {
    return getPersonaAvatar(user_avatar);
}

/**
 * Get the character avatar URL
 * @param char character name
 * @returns URL
 */
export function getCharacterAvaterURL(char: string | undefined = this_chid) : string {
    if(!char)
        return '';

    // @ts-expect-error: 7015
    return getThumbnailUrl('avatar', characters[char].avatar);
}
