-- Add-on Summary 
List the pages from where you visited one page, and all the other pages you visited from those pages. Keywords searching in page title is supported from version 0.09, enhanced in 0.19; Scrapbook support from 0.12. Naive sharing from 0.14.

-- Add-on Description 
<b>Everyday Use Case:</b>

1) I'm googling some terms, and open some pages, but somehow after I find a relevant yet not perfect link, I can't find the google page that leads me there. Maybe I closed it, or replaced it with another page. Now that I want to continue looking through "that" google search but not sure which keywords I used, I could go trying all those "google search" histories with different keywords I've tried, but I can also just open FromWhereToWhere based on this particular page and find out which google search that got me here, and open it.

2) Say some months ago, I spent more than 1 hour googling and trying out all kinds of suggestion on all those seemingly relevant pages, just to solve a configuration issue on linux. Pitifully I forgot to leave a note about which exact steps needed to be taken or which pages I consulted from, especially after the "Hooray" after the boring trying and failures. Now today I bump into the same issue on another installation, and of course starts trying google again, hoping to "hit" the answer based on my memory. After trying a few pages, I find I definitely visited some of them, but none of them looks like it. In such case I can use FWTW just like the first case to track some part of the browsing history I performed before instead of going through the searching all over again.

3) To save the trouble of finding a page that's been visited before, now I can search for the words in the titles of visited pages. Again it'll list from-where and to-where pages related with those pages, so I can easily see how I searched for the word(s) before. The titles that have all the keywords will be highlighted in blue.

4) <b> SHARING </b> (from 0.14) I used to have friends ask me questions and then I became a "google machine". After googling for several minutes, I may be able to give some possible answers(links) but I often send them the google keywords as well in case they want to search further. I had to copy every link and the keywords to send them. Now I can just get the "property" of the nodes that I want to share with my friends, send it to them in string format, and let them import the properties to create the exact same browsing history in their FWTW view. For the problems that I can find in my history already, I just need to search in FWTW and send them the property of related nodes.

<b>Note: FWTW <em>DOESN'T</em> collect browsing history, Firefox does when you let it. FWTW only search through the history data kept by Firefox. It also means you can install FWTW once you confront similar use cases as above, and it'll search through all the history data that you've chosen not to clean since you started using this instance of Firefox.</b>

<b>Introduction:</b>

Similar to "Referrer History", it shows the pages from where you got to current url during all your browsing history, and where else you visited from those urls. The difference is, it only shows those related with the current url opened in the browser, or having all the keywords, instead of displaying all the browsing history. 

<b>Howto:</b>

Open the tree view in a new tab by "Tools -> FromWhereToWhere" when your current page is the one you want to see where-from and where-to links. You can search for the pages with titles that have all the keywords you input.

In the tree view, a node can be expanded if there are urls that you visited from the url it stands for. As expanding is recursively performed, the total number of descents can be thousands, and suspension points mean the querying is in progress. You can open a url by right click on the node -> "open in new tab", or simply double click.

If according to your browsing history, current url is linked from nowhere, or there's no page title having all the search terms, the opened view will suggest that no results be found.

From 0.12, if a link had been captured by the add-on Scrapbook, it'll be highlighted in Italic font (olive if the node wasn't red or blue), and you can open it from context menu "Open Local Copy".

From 0.14, "property" and "import" are added to the menu for sharing with other users of FWTW. Select the nodes that you want to share, right click and select "property", select the property (all the text) in the dialog.  <b> NOTE: </b> the subnodes won't be included in the property of the node if the node hasn't been expanded ever, so please take this chance to examine if the subnodes are the exact content that you want to share. The last visited dates are not included in property for now. Send the text to whoever you want to share, and in their FWTW view, select "import", paste the whole text, and the same nodes will be displayed in their view, with all the subnodes if you include them in the property.

From 0.19 more accurate searching is supported as "key1 key2".  An extreme and potentially time-consuming example is "", which lists all the history in tree structure. Exclusions are -keyword3, -"key4 key5", etc.

-- Developer Comments 
1. the add-on is still in a pre-alpha stage; 
2. it only reads from your local browsing history and doesn't write to the history database or share any of your history by net without your direct instruction; 
3. as all the information it displays is based on the local browsing history in the profile of current Firefox instance, it doesn't integrate the browsing history from other profiles that you may have.

Any issue report or comment is welcome.