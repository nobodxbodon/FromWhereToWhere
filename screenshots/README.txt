-- Add-on Summary 
List the pages from where you visited one page, and all the other pages you visited from those pages. Keywords searching in page title is supported from version 0.09, enhanced in 0.19; Scrapbook support from 0.12. Naive sharing from 0.14.

-- Add-on Description 
<b>Everyday Use Case:</b>

1) I'm googling some terms, and opening some pages, but somehow after I find a relevant yet not perfect link, I can't find the searching result page that leads me there. Maybe I closed it, or replaced it with another page. Now I want to continue looking through "that" specific search with those exact search terms I used. Instead of trying all those "xxx search" in Firefox history having different keywords I've tried, I can open FromWhereToWhere based on this particular page, find out which searching result page got me here, and open it.

2) Say some months ago, I spent more than 1 hour searching and trying out all kinds of suggestion in seemingly relevant pages, just to solve a configuration issue under Linux. Pitifully, with a "Hooray" for solving the issue after the boring trying and failures, I forgot to leave a note about the exact steps needed or the pages I consulted. Today "luckily" I bump into the same issue on another installation, and of course start searching again, hoping to "hit" the answer based on my memory. I find some pages familiar, but none of them looks like the one(s) having the final solution. I can use FromWhereToWhere just like in 1) to track only the relevant part of the browsing history instead of going through the searching and trying all over again.

3) To save the trouble of finding a page that's been visited before, I can also search for the words in the titles of visited pages --- also with from-where and to-where pages --- so I can easily see how I searched for the word(s) before. The titles that have all the search terms will be highlighted in blue.

4) <b> SHARING </b> (from 0.14) Some friends ask me questions and then I become a "searching machine". After several minutes, I may be able to give some possible answers(links) but I often send them the search terms as well in case they want to search further. Instead of copying every link plus the terms and send them, now I can use FromWhereToWhere to get the tree(s) of relevant pages like in 1) or 3), and then use "property"/"import" functions to share the experience with my friends (see HOWTO "From 0.14").

<b>Note: FromWhereToWhere <em>DOESN'T</em> collect browsing history, Firefox does when you let it. FromWhereToWhere only search through the history data kept by Firefox. It also means you can install FromWhereToWhere at the moment you confront similar use cases as above, as it'll search through all the history data that you've chosen not to clean ever since you started using this instance of Firefox.</b>

<b>Introduction:</b>

Similar to "Referrer History", it shows the pages from where you got to current url during all your browsing history, and where else you visited from those urls. The difference is, it only shows those related with the current URL opened in the browser, or having all the search terms, instead of displaying all the browsing history. 

<b>HOWTO:</b>

Open the tree view in a new tab by "Tools -> FromWhereToWhere" when your current page is the one you want to see where-from and where-to links. You can search for the pages with titles that have all the keywords you input.

In the tree view, a node can be expanded if there are URLs that you visited from the URL it stands for. As expanding is recursively performed, the total number of descents can be thousands, and suspension points mean the querying is in progress. You can open a URL by right click on the node -> "open in new tab", or simple double click.

If according to your browsing history, current URL is linked from nowhere, a node stands for the current URL will display in the view. If no page title has all the search terms, the opened view will suggest that no results be found.

From 0.12, if a link had been captured by the add-on Scrapbook, it'll be highlighted in Italic font (olive if the node wasn't red or blue), and you can open it from context menu "Open Local Copy".

From 0.14, "property" and "import" are added to the menu for sharing with other users. Select the nodes that you want to share, right click -> "property", select the property (all the text) in the opened dialog.  <b> NOTE: </b> the sub-nodes won't be included in the property of the node if the node hasn't been expanded ever, so please take this chance to examine if the sub-nodes are the exact content that you want to share. The last visited dates are not included in property for now. Send the text to whoever you want to share, and in their FromWhereToWhere view, select "import", paste the whole text, and the same nodes will be displayed in their view, with all the sub-nodes if you include them in the property.

From 0.19 more accurate searching is supported as "key1 key2".  An extreme and potentially time-consuming example is "", which lists all the history in tree structure. Exclusion is supported too, in the form of -keyword3 or -"key4 key5".

-- Developer Comments 
1. the add-on is still in a pre-alpha stage; 
2. it only reads from your local browsing history and doesn't write to the history database or share any of your history by net without your direct instruction; 
3. as all the information it displays is based on the local browsing history in the profile of current Firefox instance, it doesn't integrate the browsing history from other profiles that you may have.

Any issue report or comment is welcome.