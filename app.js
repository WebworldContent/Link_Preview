const puppeteer = require('puppeteer');
const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.use(express.json());
app.use(express.urlencoded({extended: true}));


const getInfo = async (url) => {
  const browser = await puppeteer.launch({});
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  page.on('dialog', async dialog => {
    await dialog.dismiss()
  });

  const info = await page.evaluate(() => {

    const filteredImage = () => {
      const imgs = Array.from(document.querySelectorAll("img")).filter((img) => {
        let addImg = true;
          if (img.naturalWidth > img.naturalHeight) {
            if (img.naturalWidth / img.naturalHeight > 3) {
              addImg = false;
            }
          } else {
            if (img.naturalHeight / img.naturalWidth > 3) {
              addImg = false;
            }
          }
          if (img.naturalHeight <= 50 || img.naturalWidth <= 50) {
            addImg = false;
          }
        return addImg;
      })[0];
      return imgs !== undefined ? imgs.getAttribute('src') : '';
    };

    const getTitle = () => {
      let title = document.querySelector('meta[property="og:title"]');
      if (title != null && title.content.length > 0) {
        return title.content;
      }
      title = document.querySelector('meta[property="twitter:title"]');
      if (title != null && title.content.length > 0) {
        return title.content;
      }
      title = document.querySelector('title');
      if (title != null && title.innerText.length > 0) {
        return title.innerText;
      }
      title = document.querySelector('h1');
      if (title != null && title.innerText.length > 0) {
        return title.innerText;
      }
      return '';
    };

    const getDescription = () => {
      let description = document.querySelector('meta[property="og:description"]');
      if (description != null && description.content.length > 0) {
        return description.content;
      }
      description = document.querySelector('meta[property="twitter:description"]');
      if (description != null && description.content.length > 0) {
        return description.content;
      }
      description = document.querySelector('meta[name="description"]');
      if (description != null && description.content.length > 0) {
        return description.content;
      }
      description = document.querySelector('h2');
      if (description != null && description.innerText.length > 0) {
        return description.innerText
      }
      description = document.querySelector('article');
      if (description != null && description.innerText.length > 0) {
        return description.innerText
      }
      const filteredText = Array.from(document.querySelectorAll('p')).filter((data) => {
        if (data != null && data.innerText.length > 80 || data.innerText.length > 40) {
          return data;
        }
      })[0].innerText;
      return filteredText !== undefined ? filteredText.slice(0,150) : '';
    };

    const getDomain = () => {
      let domain = document.querySelector("link[rel=canonical]");
      if (domain != null && domain.href.length > 0) {
        let filterDomain = domain.href.split('//')[1];
        if (filterDomain.indexOf('/') != -1) {
          return filterDomain.slice(0,filterDomain.indexOf('/'));
        }
        return filterDomain;
      }
      domain = document.querySelector('meta[property="og:url"]');
      if (domain != null && domain.content.length > 0) {
        let filterDomain = domain.content.split('//')[1];
        if (filterDomain.indexOf('/') != -1) {
          return filterDomain.slice(0,filterDomain.indexOf('/'));
        }
        return filterDomain;
      }
      return url.split('//')[1];
    };

    const getImage = () => {
      let image = document.querySelector('meta[property="og:image"]');
      if (image != null && image.content.length > 0) {
        return image.content;
      }
      image = document.querySelector('meta[property="twitter:image"]');
      if (image != null && image.content.length > 0) {
        return image.content;
      }
      console.log(filteredImage());
      return filteredImage();
    };

    return {
      title: getTitle() || '',
      domainName: getDomain() || '',
      description: getDescription() || '',
      mainImage: getImage() || ''
    };

  });


  await browser.close();
  return info;
  
};

app.get('/', (req, res) => {
  res.render('index');
});


app.get('/fetch', (req, res) => {
  if (req.query.link !== undefined) {
    getInfo(req.query.link).then((data)=>{
      res.json(data);
    })
  }
});



app.listen(3000);
