// routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const path = require('path');

// Import required libraries for generating reports
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const { Document, Packer, Paragraph, TextRun } = require('docx');

// Import models (adjust the paths as needed)
const Supplier = require('../models/supplierModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const Stock = require('../models/stockModel');

// =======================================
// GET /reports - Render the reports page
// =======================================
router.get('/', async (req, res) => {
  try {
    // Retrieve all data concurrently
    const [suppliers, orders, stockItems] = await Promise.all([
      Supplier.find().sort({ name: 1 }),
      Order.find()
           .populate('product')       // populate product to show names
           .populate('supplier')      // populate supplier details
           .sort({ orderDate: 1 }),
      Stock.find()
           .populate('product')       // populate product details
           .sort({ arrivalDate: 1 })
    ]);

    // Render the reports view (reports.ejs)
    res.render('reports', { suppliers, orders, stockItems });
  } catch (error) {
    console.error("Error fetching report data:", error);
    res.status(500).send("Server error.");
  }
});

// ======================================================
// GET /reports/download-report?format=pdf|excel|word
// ======================================================
router.get('/download-report', async (req, res) => {
  const format = req.query.format;

  try {
    // Query all required data concurrently,
    // with orders and stocks populated to include product (and supplier) details.
    const [suppliers, products, orders, stocks] = await Promise.all([
      Supplier.find().sort({ name: 1 }),
      Product.find().sort({ name: 1 }),
      Order.find()
           .populate('product')       // populate product details
           .populate('supplier')      // populate supplier details if needed
           .sort({ orderDate: 1 }),
      Stock.find()
           .populate('product')       // populate product details
           .sort({ arrivalDate: 1 })
    ]);

    if (format === 'pdf') {
      // ----- PDF Generation (using PDFKit) -----
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
      doc.pipe(res);

      // Title
      doc.fontSize(18).text("Inventory Report", { align: 'center' });
      doc.moveDown();

      // Section: Suppliers
      doc.fontSize(14).text("Suppliers:", { underline: true });
      doc.moveDown(0.5);
      suppliers.forEach(supplier => {
        doc.fontSize(10)
          .text(`Name: ${supplier.name}`)
          .text(`Contact: ${supplier.contact}`)
          .text(`Email: ${supplier.email}`)
          .text(`Address: ${supplier.address}`)
          .moveDown();
      });
      doc.addPage();

      // Section: Products
      doc.fontSize(14).text("Products:", { underline: true });
      doc.moveDown(0.5);
      products.forEach(product => {
        doc.fontSize(10)
          .text(`Name: ${product.name}`)
          .text(`Category: ${product.category}`)
          .moveDown();
      });
      doc.addPage();

      // Section: Order History
      doc.fontSize(14).text("Order History:", { underline: true });
      doc.moveDown(0.5);
      orders.forEach(order => {
        const orderDateString = order.orderDate ? new Date(order.orderDate).toDateString() : "Not Set";
        // When product is populated, order.product.name should return the proper name.
        doc.fontSize(10)
          .text(`Product: ${order.product ? order.product.name : "Unknown"}`)
          .text(`Quantity: ${order.orderQuantity}`)
          .text(`Supplier: ${order.supplier ? order.supplier.name : "No Supplier"}`)
          .text(`Order Date: ${orderDateString}`)
          .moveDown();
      });
      doc.addPage();

      // Section: Stocks
      doc.fontSize(14).text("Stocks:", { underline: true });
      doc.moveDown(0.5);
      stocks.forEach(stock => {
        const arrivalDateString = stock.arrivalDate ? new Date(stock.arrivalDate).toDateString() : "Not Set";
        doc.fontSize(10)
          .text(`Product: ${stock.product ? stock.product.name : "Unknown"}`)
          .text(`Category: ${stock.category}`)
          .text(`Condition: ${stock.productCondition}`)
          .text(`Quantity: ${stock.quantity}`)
          .text(`Arrival Date: ${arrivalDateString}`)
          .moveDown();
      });
      doc.end();

    } else if (format === 'excel') {
      // ----- Excel Generation (using ExcelJS) -----
      const workbook = new ExcelJS.Workbook();

      // Suppliers Sheet
      const supSheet = workbook.addWorksheet('Suppliers');
      supSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Contact', key: 'contact', width: 20 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Address', key: 'address', width: 40 }
      ];
      suppliers.forEach(supplier => {
        supSheet.addRow({
          name: supplier.name,
          contact: supplier.contact,
          email: supplier.email,
          address: supplier.address
        });
      });

      // Products Sheet
      const prodSheet = workbook.addWorksheet('Products');
      prodSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Category', key: 'category', width: 20 }
      ];
      products.forEach(product => {
        prodSheet.addRow({
          name: product.name,
          category: product.category
        });
      });

      // Order History Sheet
      const orderSheet = workbook.addWorksheet('Order History');
      orderSheet.columns = [
        { header: 'Product', key: 'product', width: 30 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Supplier', key: 'supplier', width: 30 },
        { header: 'Order Date', key: 'orderDate', width: 20 }
      ];
      orders.forEach(order => {
        orderSheet.addRow({
          product: order.product ? order.product.name : "Unknown",
          quantity: order.orderQuantity,
          supplier: order.supplier ? order.supplier.name : "No Supplier",
          orderDate: order.orderDate ? new Date(order.orderDate).toDateString() : "Not Set"
        });
      });

      // Stocks Sheet
      const stockSheet = workbook.addWorksheet('Stocks');
      stockSheet.columns = [
        { header: 'Product', key: 'product', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Condition', key: 'productCondition', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Arrival Date', key: 'arrivalDate', width: 20 }
      ];
      stocks.forEach(stock => {
        stockSheet.addRow({
          product: stock.product ? stock.product.name : "Unknown",
          category: stock.category,
          productCondition: stock.productCondition,
          quantity: stock.quantity,
          arrivalDate: stock.arrivalDate ? new Date(stock.arrivalDate).toDateString() : "Not Set"
        });
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
      await workbook.xlsx.write(res);
      res.end();

    } else if (format === 'word') {
      // ----- Word Document Generation (using docx) -----
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: "Inventory Report",
              heading: "Title",
              alignment: "center"
            }),
            new Paragraph({ text: "" }) // Spacer
          ]
        }]
      });

      // Suppliers Section
      let supplierContent = [];
      supplierContent.push(new Paragraph({ text: "Suppliers:", heading: "Heading1" }));
      suppliers.forEach(supplier => {
        supplierContent.push(new Paragraph(`Name: ${supplier.name}`));
        supplierContent.push(new Paragraph(`Contact: ${supplier.contact}`));
        supplierContent.push(new Paragraph(`Email: ${supplier.email}`));
        supplierContent.push(new Paragraph(`Address: ${supplier.address}`));
        supplierContent.push(new Paragraph("")); // spacer
      });
      doc.addSection({ children: supplierContent });

      // Products Section
      let productContent = [];
      productContent.push(new Paragraph({ text: "Products:", heading: "Heading1" }));
      products.forEach(product => {
        productContent.push(new Paragraph(`Name: ${product.name}`));
        productContent.push(new Paragraph(`Category: ${product.category}`));
        productContent.push(new Paragraph("")); // spacer
      });
      doc.addSection({ children: productContent });

      // Order History Section
      let orderContent = [];
      orderContent.push(new Paragraph({ text: "Order History:", heading: "Heading1" }));
      orders.forEach(order => {
        let orderDateStr = order.orderDate ? new Date(order.orderDate).toDateString() : "Not Set";
        orderContent.push(new Paragraph(`Product: ${order.product ? order.product.name : "Unknown"}`));
        orderContent.push(new Paragraph(`Quantity: ${order.orderQuantity}`));
        orderContent.push(new Paragraph(`Supplier: ${order.supplier ? order.supplier.name : "No Supplier"}`));
        orderContent.push(new Paragraph(`Order Date: ${orderDateStr}`));
        orderContent.push(new Paragraph("")); // spacer
      });
      doc.addSection({ children: orderContent });

      // Stocks Section
      let stockContent = [];
      stockContent.push(new Paragraph({ text: "Stocks:", heading: "Heading1" }));
      stocks.forEach(stock => {
        let arrivalDateStr = stock.arrivalDate ? new Date(stock.arrivalDate).toDateString() : "Not Set";
        stockContent.push(new Paragraph(`Product: ${stock.product ? stock.product.name : "Unknown"}`));
        stockContent.push(new Paragraph(`Category: ${stock.category}`));
        stockContent.push(new Paragraph(`Condition: ${stock.productCondition}`));
        stockContent.push(new Paragraph(`Quantity: ${stock.quantity}`));
        stockContent.push(new Paragraph(`Arrival Date: ${arrivalDateStr}`));
        stockContent.push(new Paragraph("")); // spacer
      });
      doc.addSection({ children: stockContent });

      res.setHeader("Content-Disposition", 'attachment; filename="report.docx"');
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.wordprocessingml.document");

      Packer.toBuffer(doc)
        .then(buffer => { res.send(buffer); })
        .catch(err => {
          console.error("Error generating Word document:", err);
          res.status(500).send("Error generating document.");
        });

    } else {
      res.status(400).send('Invalid format.');
    }
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).send("Server error.");
  }
});

module.exports = router;
