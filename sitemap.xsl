<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:sm="http://www.sitemaps.org/schemas/sitemap/0.9"
    xmlns:xhtml="http://www.w3.org/1999/xhtml">

<xsl:output method="html" indent="yes" encoding="UTF-8"/>

<xsl:template match="/">
    <html>
    <head>
        <title>TurboShare Sitemap</title>
        <meta charset="UTF-8"/>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; background: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            th, td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #007bff; color: white; font-weight: 600; position: sticky; top: 0; }
            tr:hover { background: #f8f9fa; }
            tr:nth-child(even) { background: #fafafa; }
            .url { color: #007bff; text-decoration: none; word-break: break-all; }
            .url:hover { text-decoration: underline; }
            .priority { font-weight: bold; }
            .priority-1 { color: #28a745; }
            .priority-09 { color: #17a2b8; }
            .priority-08 { color: #ffc107; }
            .priority-07 { color: #6c757d; }
            .priority-06 { color: #adb5bd; }
            .lang-links { font-size: 0.85em; color: #666; }
            .lang-links a { margin-right: 8px; color: #6c757d; text-decoration: none; }
            .lang-links a:hover { color: #007bff; text-decoration: underline; }
            .stats { margin-bottom: 20px; padding: 15px; background: white; border-radius: 4px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stats span { margin-right: 20px; font-weight: 600; color: #333; }
        </style>
    </head>
    <body>
        <h1>📋 TurboShare.org.uk - Sitemap</h1>
        <div class="stats">
            <span>Total URLs: <xsl:value-of select="count(sm:urlset/sm:url)"/></span>
            <span>Generated: <xsl:value-of select="sm:urlset/sm:url[1]/sm:lastmod"/></span>
        </div>
        <table>
            <thead>
                <tr>
                    <th>URL</th>
                    <th>Last Modified</th>
                    <th>Change Frequency</th>
                    <th>Priority</th>
                    <th>Languages</th>
                </tr>
            </thead>
            <tbody>
                <xsl:for-each select="sm:urlset/sm:url">
                    <tr>
                        <td>
                            <a class="url" href="{sm:loc}" target="_blank"><xsl:value-of select="sm:loc"/></a>
                        </td>
                        <td><xsl:value-of select="sm:lastmod"/></td>
                        <td><xsl:value-of select="sm:changefreq"/></td>
                        <td>
                            <xsl:choose>
                                <xsl:when test="sm:priority >= 1"><span class="priority priority-1"><xsl:value-of select="sm:priority"/></span></xsl:when>
                                <xsl:when test="sm:priority >= 0.9"><span class="priority priority-09"><xsl:value-of select="sm:priority"/></span></xsl:when>
                                <xsl:when test="sm:priority >= 0.8"><span class="priority priority-08"><xsl:value-of select="sm:priority"/></span></xsl:when>
                                <xsl:when test="sm:priority >= 0.7"><span class="priority priority-07"><xsl:value-of select="sm:priority"/></span></xsl:when>
                                <xsl:otherwise><span class="priority priority-06"><xsl:value-of select="sm:priority"/></span></xsl:otherwise>
                            </xsl:choose>
                        </td>
                        <td>
                            <div class="lang-links">
                                <xsl:for-each select="xhtml:link[@rel='alternate']">
                                    <a href="{@href}" target="_blank" title="{@hreflang}">[<xsl:value-of select="@hreflang"/>]</a>
                                </xsl:for-each>
                            </div>
                        </td>
                    </tr>
                </xsl:for-each>
            </tbody>
        </table>
    </body>
    </html>
</xsl:template>

</xsl:stylesheet>